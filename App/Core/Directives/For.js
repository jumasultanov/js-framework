import Directive from "../Directive.js";
import Area from "../Area.js";
import { Directives, InternalProxy } from "../Service.js";

class For {

    //Название конструкции
    static name = 'for';
    //Названия связанных конструкции
    static nextConstructions = ['for-else'];
    //Константы изменения массива
    static ARRAY_PUSH = 0;
    static ARRAY_DELETE = 1;
    static ARRAY_MOVE = 2;
    static ARRAY_REVERSE = 3;
    static ARRAY_SORT = 4;
    //Предыдущее прочитанное свойство массива
    static prevPosition = null;

    /**
     * Регистрация директивы
     */
    static boot() {
        //Добавляем слушателей на события
        Directive
            .include('onParse', this)
            .include('onProxyGet', this)
            .include('onProxySet', this)
            .include('onProxyDeleteProperty', this)
            .include('onExecute', this);
    }

    /**
     * Событие при парсинге
     * @param {string} expr Выражение
     * @param {Node} node Элемент DOM
     * @param {object} data Данные конструкции
     * @param {Parser} parser Объект парсера
     * @returns {object} Должен возвращать объект из:
     *      {
     *          - {string} expr             - выражение, можно изменять
     *          - {object} list             - список блоков-компонентов
     *          - {string|null} next        - следующий блок конструкции, если нужно
     *          - {boolean} readyComponent  - cразу ли запускать компонент
     *      }
     */
    static onParse(expr, node, data, parser) {
        let list = {};
        //Деление выражения конструкции
        //на названия переменных в цикле и название в объекте данных, который перебирается
        let as = [];
        if (expr.indexOf(' in ') != -1) {
            [as, expr] = expr.split(' in ');
            as = as.replace(/[\(\)\s]/g, '').split(',');
        }
        data.as = as;
        //Собираем и сохраняем последующие блоки конструкции
        const next = parser.unionNodes(node.nextElementSibling, this.nextConstructions, list);
        return { expr, list, next, readyComponent: false }
    }

    /**
     * Событие при чтении свойства из объекта
     * @param {object} target Объект
     * @param {string} prop Название свойства объекта
     * @param {object} receiver Целевой объект
     */
    static onProxyGet(target, prop) {
        if (!target.isArray) return undefined;
        if (!isNaN(Number(prop))) {
            this.prevPosition = prop;
        } else if (prop == 'sort') {
            this.arraySort = [];
            this.arrayLastIndex = target.length - 1;
        } else if (prop == 'reverse') {
            this.arrayReverse = [];
            this.arrayLength = (target.length % 2 == 0 ? target.length : target.length - 1 );
        }
    }

    /**
     * Событие при изменении свойства из объекта
     * @param {object} target Объект
     * @param {string} prop Название свойства объекта
     * @param {any} val Значение свойства объекта
     * @param {object} receiver Целевой объект
     */
    static onProxySet(target, prop, val, receiver) {
        if (!target.isArray) return undefined;
        //Добавление в массив
        if (!isNaN(Number(prop))) {
            if (!(prop in target)) {
                Reflect.set(target, prop, val, receiver);
                console.warn('PUSH', prop, val);
                InternalProxy.one(target, prop);
                this.arrayChange(target, prop, this.ARRAY_PUSH);
            } else {
                // TODO: 
                //      Появляется ошибка Component.js:153 prop 'name' from undefined in component1.name
                //          при полном очистке либо как-то еще (не удалось отследить)
                //
                //      Изменить название класса Directives на Executor
                //      Отработать события и удаление из элементов при отключении компонентов (может и нет)
                //      
                //
                //      Отработать перебор объектов, чисел и строк
                //      ---
                //
                if (this.arraySort) {
                    if (target[prop] !== val) this.arraySort.push(prop);
                    Reflect.set(target, prop, val, receiver);
                    if (prop == this.arrayLastIndex) {
                        this.arrayChange(target, this.arraySort, this.ARRAY_SORT);
                        this.arraySort = null;
                    }
                } else if (this.arrayReverse) {
                    this.arrayReverse.push(prop);
                    Reflect.set(target, prop, val, receiver);
                    if (this.arrayReverse.length == this.arrayLength) {
                        this.arrayChange(target, this.arrayReverse, this.ARRAY_REVERSE);
                        this.arrayReverse = null;
                    }
                } else {
                    // Отсюда начинаются перемещения индексов
                    //console.group('CHANGE INDEX');
                    console.warn('Move', this.prevPosition + ' -> ' + prop, val);
                    /*console.log(prop, val);
                    console.log(target[prop]);
                    console.groupEnd();*/
                    if (this.prevPosition === null || target[this.prevPosition] !== val) {
                        console.warn('PASTE NEW', prop, val);
                        Reflect.set(target, prop, val, receiver);
                        InternalProxy.one(target, prop);
                        this.arrayChange(target, prop, this.ARRAY_PUSH);
                    } else {
                        console.warn('MOVE', prop, val);
                        this.arrayChange(target, { value: prop, replace: this.prevPosition }, this.ARRAY_MOVE);
                        Reflect.set(target, prop, val, receiver);
                    }
                }
            }
            this.prevPosition = null;
            return true;
        }
    }

    /**
     * Событие при удалении свойства из объекта
     * @param {object} target Объект
     * @param {string} prop Название свойства объекта
     * @param {object} receiver Целевой объект
     */
    static onProxyDeleteProperty(target, prop, receiver) {
        if (!target.isArray) return undefined;
        //Удаление из массива
        if (!isNaN(Number(prop))) {
            console.warn('DELETE', prop);
            console.log(target);
            this.arrayChange(target, prop, this.ARRAY_DELETE);
            return Reflect.deleteProperty(target, prop, receiver);
        }
    }

    /**
     * Вызывает событие изменения в массиве через зарегистрированные зависимости в родительском объекте
     * @param {object} target Перебираемый объект
     * @param {number|object} index Ключ измененного элемента
     * @param {number} change Константа из this.ARRAY_*
     */
    static arrayChange(target, index, change) {
        const root = target.getWatcher();
        root.vars.getHandler().call(root.key, {
            force: true,
            change, index
        }, true);
    }

    /**
     * Событие при активации конструкции
     * @param {VNode} vnode 
     */
    static onExecute(vnode) {
        this.constr(vnode);
    }

    /**
     * Выполнение конструкции
     */
    static constr(vnode) {
        let data = vnode.data.constr.for;
        const namePrefix = `${data.component.name}:`;
        //Выполнение выражения для цикла
        Directives.expr(data.expr, data, vnode.getVars(), false, params => {
            console.warn('ARRAY CHANGE', data);
            console.warn(params);
            const count = data.current.length;
            let forElse;
            //Обощаем данные для конкретного изменения
            this.vnode = vnode;
            this.data = data;
            this.namePrefix = `${data.component.name}:`;
            //
            if (data.next) forElse = vnode.data.constr[data.next];
            if (data.current instanceof Object) {
                if (count && forElse && forElse.component.isActive()) {
                    vnode.component.removeChild(forElse.component);
                }
                if (params && 'change' in params) {
                    const key = params.index;
                    switch (params.change) {
                        case this.ARRAY_PUSH:
                            this.componentPush(key);
                            return;
                        case this.ARRAY_MOVE:
                            this.componentSwap(key.replace, key.value);
                            return;
                        case this.ARRAY_REVERSE:
                            for (let i = 0; i < key.length; i += 2) {
                                const first = key[i];
                                const second = key[i + 1];
                                this.componentSwap(first, second);
                            }
                            return;
                        case this.ARRAY_SORT:
                            this.componentSort(key);
                            return;
                        case this.ARRAY_DELETE:
                            this.componentDelete(namePrefix + key);
                            if (data.current.length > 1) return;
                            break;
                    }
                } else {
                    //Добавляем скрытый метод getWatcher, которая будет вести до родителя оригинального объекта
                    const parent = Area.getOwnKey(data.component.path.slice(0, -1), data.expr);
                    if (parent) InternalProxy.setWatcher(parent.vars, data.expr);
                    //Обновляем весь список
                    let keys = Object.keys(data.current);
                    if (keys.length) {
                        for (const key of keys) {
                            this.componentInsert(key, this.vnode.data.space);
                        }
                        return;
                    }
                }
            }
            if (forElse) {
                //Если нет данных в списке, то выполняем конструкцию ELSE
                vnode.component.replaceChildren([forElse.component], vnode.data.space, vnode.data.inserted);
            }
        });
    }

    static componentPush(key) {
        const name = this.namePrefix + key;
        let before = this.vnode.data.space;
        if (name in this.vnode.component.children) {
            before = this.componentDelete(name, true);
        }
        this.componentInsert(key, before);
    }

    static componentDelete(name, getNext = false) {
        const deleteComp = this.vnode.component.children[name];
        let el;
        if (getNext) el = deleteComp.element.nextSibling;
        this.vnode.component.removeChild(deleteComp, this.vnode.data.inserted, true);
        return el;
    }

    static componentInsert(key, space) {
        const insertComp = this.data.component.clone(this.namePrefix + key, true, this.getObjectForCycle(this.data, key));
        this.vnode.component.insertChild(insertComp, space, this.vnode.data.inserted);
    }

    static componentSwap(key1, key2) {
        const comp1 = this.vnode.component.children[this.namePrefix + key1];
        const comp2 = this.vnode.component.children[this.namePrefix + key2];
        this.vnode.component.swapChild(comp1, comp2);
        comp1.vars[this.data.as[1]||'key'] = key2;
        comp2.vars[this.data.as[1]||'key'] = key1;
    }

    static componentSort(keys) {
        let tempComps = {};
        let tempAreas = {};
        const areas = Area.findFull(this.data.component.path.slice(0, -1));
        for (let i = 0; i < keys.length; i++) {
            const name = this.namePrefix + keys[i];
            const value = this.data.current[keys[i]];
            for (let j = 0; j < keys.length; j++) {
                if (i === j) continue;
                const foundName = this.namePrefix + keys[j];
                const comp = this.vnode.component.children[foundName];
                if (comp.vars[this.data.as[0]||'item'] === value) {
                    comp.updateName(name);
                    comp.vars[this.data.as[1]||'key'] = keys[i];
                    tempComps[name] = comp;
                    tempAreas[name] = areas[foundName];
                    break;
                }
            }
        }
        for (let name in tempComps) {
            this.vnode.component.children[name] = tempComps[name];
            areas[name] = tempAreas[name];
        }
        let names = [];
        for (let index in this.data.current) names.push(this.data.component.name + ':' + index);
        this.vnode.component.collectChildrenBlocks(names, this.vnode.data.space);
    }

    /**
     * Возвращает объект данных для элемента перебираемого объекта или массивиа
     * @param {object} data Данные конструкции цикла
     * @param {string} key Название ключа
     * @returns {object}
     */
    static getObjectForCycle(data, key) {
        const obj = {};
        obj[data.as[0]||'item'] = data.current[key];
        obj[data.as[1]||'key'] = key;
        obj[data.as[2]||'items'] = data.current;
        return obj;
    }

}

export default For