import Directive from "../Directive.js";
import Area from "../Area.js";
import { Directives, InternalProxy } from "../Service.js";

class For {

    //Название конструкции
    static construction = 'for';
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
                //      Отработать перебор объектов, чисел и строк
                //      Распилить на классы директивы 
                //      !!! и через обсервер обращаться к каждой директиве, 
                //          если он подписан на события GET, SET и т.д.
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
            if (data.next) forElse = vnode.data.constr[data.next];
            if (data.current instanceof Object) {
                if (count && forElse && forElse.component.isActive()) {
                    vnode.component.removeChild(forElse.component);
                }
                if (params && 'change' in params) {
                    const key = params.index;
                    switch (params.change) {
                        case this.ARRAY_PUSH:
                            const replaceComp = vnode.component.children[namePrefix + key];
                            let before;
                            if (replaceComp) {
                                before = replaceComp.element.nextSibling;
                                vnode.component.removeChild(replaceComp, vnode.data.inserted, true);
                            }
                            if (!before) before = vnode.data.space;
                            const insertComp = data.component.clone(namePrefix + key, true, this.getObjectForCycle(data, key));
                            vnode.component.insertChild(insertComp, before, vnode.data.inserted);
                            return;
                        case this.ARRAY_MOVE:
                            const removeComp = vnode.component.children[namePrefix + key.value];
                            const moveComp = vnode.component.children[namePrefix + key.replace];
                            console.log('MOVE', moveComp);
                            console.log('OLD', removeComp);
                            vnode.component.swapChild(moveComp, removeComp);
                            const oldKey = moveComp.vars[data.as[1]||'key'];
                            moveComp.vars[data.as[1]||'key'] = key.value;
                            removeComp.vars[data.as[1]||'key'] = oldKey;
                            return;
                        case this.ARRAY_REVERSE:
                            for (let i = 0; i < key.length; i += 2) {
                                const first = key[i];
                                const second = key[i + 1];
                                const comp1 = vnode.component.children[namePrefix + first];
                                const comp2 = vnode.component.children[namePrefix + second];
                                console.log('FIRST', comp1);
                                console.log('SECOND', comp2);
                                vnode.component.swapChild(comp1, comp2);
                                comp1.vars[data.as[1]||'key'] = second;
                                comp2.vars[data.as[1]||'key'] = first;
                            }
                            return;
                        case this.ARRAY_SORT:
                            let tempComps = {};
                            let tempAreas = {};
                            const areas = Area.findFull(data.component.path.slice(0, -1));
                            for (let i = 0; i < key.length; i++) {
                                const name = namePrefix + key[i];
                                const value = data.current[key[i]];
                                for (let j = 0; j < key.length; j++) {
                                    if (i === j) continue;
                                    const foundName = namePrefix + key[j];
                                    const comp = vnode.component.children[foundName];
                                    if (comp.vars[data.as[0]||'item'] === value) {
                                        comp.updateName(name);
                                        comp.vars[data.as[1]||'key'] = key[i];
                                        tempComps[name] = comp;
                                        tempAreas[name] = areas[foundName];
                                        break;
                                    }
                                }
                            }
                            for (let name in tempComps) {
                                vnode.component.children[name] = tempComps[name];
                                areas[name] = tempAreas[name];
                            }
                            let names = [];
                            for (let index in data.current) names.push(data.component.name + ':' + index);
                            vnode.component.collectChildrenBlocks(names, vnode.data.space);
                            return;
                        case this.ARRAY_DELETE:
                            //Удаляем компонент из родителя и его данные
                            const deleteComp = vnode.component.getChildren()[namePrefix + key];
                            console.log('OLD', deleteComp);
                            vnode.component.removeChild(deleteComp, vnode.data.inserted, true);
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
                            const name = `${data.component.name}:${key}`;
                            const component = data.component.clone(name, true, this.getObjectForCycle(data, key));
                            vnode.component.insertChild(component, vnode.data.space, vnode.data.inserted);
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