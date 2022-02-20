import Directive from "../Directive.js";
import Area from "../Area.js";
import { Executor, AreaProxy, AreaExpanding } from "../Service.js";

class For {

    //Название конструкции
    static name = 'for';
    //Названия связанных конструкции
    static nextConstructions = ['for-else'];
    //Константы изменения массива
    static ACTION_PUSH = 0;
    static ACTION_DELETE = 1;
    static ACTION_MOVE = 2;
    static ACTION_REVERSE = 3;
    static ACTION_SORT = 4;
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
            expr = expr.trim();
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
        if (!target.iterating) return undefined;
        if (target.isArray) {
            if (!isNaN(Number(prop))) {
                this.prevPosition = prop;
            } else if (prop == 'sort') {
                this.arraySort = [];
                this.arrayLastIndex = target.length - 1;
            } else if (prop == 'reverse') {
                this.arrayReverse = [];
                this.arrayLength = target.length - target.length % 2;
            }
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
        if (!target.iterating) return undefined;
        //Определяем настройки для действий в конце метода
        let method = null;
        let key = prop;
        let changeBefore = true, toProxy = true;
        if (target.isArray) {
            //Если свойство не число, то ничего не делаем для массива
            if (isNaN(Number(prop))) return undefined;
            //Если ключ не занят, то операция добавления
            if (!(prop in target)) {
                method = this.ACTION_PUSH;
            } else {
                toProxy = false;
                if (this.arraySort) {
                    if (target[prop] !== val) this.arraySort.push(prop);
                    if (prop == this.arrayLastIndex) {
                        key = this.arraySort;
                        this.arraySort = null;
                        method = this.ACTION_SORT;
                    }
                } else if (this.arrayReverse) {
                    this.arrayReverse.push(prop);
                    if (this.arrayReverse.length == this.arrayLength) {
                        key = this.arrayReverse;
                        this.arrayReverse = null;
                        method = this.ACTION_REVERSE;
                    }
                } else {
                    if (this.prevPosition === null || target[this.prevPosition] !== val) {
                        toProxy = true;
                        method = this.ACTION_PUSH;
                    } else {
                        changeBefore = false;
                        method = this.ACTION_MOVE;
                        key = { value: prop, prev: this.prevPosition };
                    }
                }
            }
            this.prevPosition = null;
        } else {
            method = this.ACTION_PUSH;
        }
        //Основные действия
        let success = false;
        if (changeBefore) success = Reflect.set(target, prop, val, receiver);
        if (toProxy) AreaProxy.one(target, prop);
        if (method !== null) this.arrayChange(target, key, method);
        if (!changeBefore) success = Reflect.set(target, prop, val, receiver);
        return success;
    }

    /**
     * Событие при удалении свойства из объекта
     * @param {object} target Объект
     * @param {string} prop Название свойства объекта
     * @param {object} receiver Целевой объект
     */
    static onProxyDeleteProperty(target, prop, receiver) {
        if (!target.iterating) return undefined;
        if (target.isArray && isNaN(Number(prop))) return undefined;
        this.arrayChange(target, prop, this.ACTION_DELETE);
        return Reflect.deleteProperty(target, prop, receiver);
    }

    /**
     * Вызывает событие изменения в массиве через зарегистрированные зависимости в родительском объекте
     * @param {object} target Перебираемый объект
     * @param {number|object} index Ключ измененного элемента
     * @param {number} change Константа из this.ACTION_*
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
        //Выполнение выражения для цикла
        Executor.expr(data.expr, data, vnode.getVars(), false, params => {
            let forElse;
            //Обощаем данные для конкретного изменения
            this.vnode = vnode;
            this.data = data;
            this.namePrefix = `${data.component.name}:`;
            if (data.next) forElse = vnode.data.constr[data.next];
            if (data.current instanceof Object) {
                const count = Object.keys(data.current).length;
                if (count && forElse && forElse.component.isActive()) {
                    vnode.component.removeChild(forElse.component, vnode.data.inserted);
                }
                if (params && 'change' in params) {
                    this.componentChange(params);
                    if (params.change !== this.ACTION_DELETE || count > 1) return;
                } else {
                    //Добавляем флаг, что объект будет итерирован
                    AreaExpanding.setIterating(data.current);
                    //Добавляем скрытый метод getWatcher, которая будет вести до родителя оригинального объекта
                    const parent = Area.getOwnKey(data.component.path.slice(0, -1), data.expr);
                    if (parent) AreaExpanding.setWatcher(parent.vars, data.expr);
                    //Обновляем весь список
                    if (count) {
                        for (const key in data.current) {
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

    /**
     * Изменение компонентов в перебранном объекте
     * @param {object} params 
     */
    static componentChange(params) {
        const key = params.index;
        switch (params.change) {
            case this.ACTION_PUSH:
                this.componentPush(key);
                break;
            case this.ACTION_MOVE:
                this.componentSwap(key.prev, key.value);
                break;
            case this.ACTION_REVERSE:
                for (let i = 0; i < key.length; i += 2) {
                    const first = key[i];
                    const second = key[i + 1];
                    this.componentSwap(first, second);
                }
                break;
            case this.ACTION_SORT:
                this.componentSort(key);
                break;
            case this.ACTION_DELETE:
                this.componentDelete(this.namePrefix + key);
                break;
        }
    }

    /**
     * Вставка компонента с проверкой на место вставки  
     * @param {string} key 
     */
    static componentPush(key) {
        const name = this.namePrefix + key;
        let before = this.vnode.data.space;
        if (name in this.vnode.component.children) {
            before = this.componentDelete(name, true);
        }
        this.componentInsert(key, before);
    }

    /**
     * Удаление компонента
     * @param {string} name Название компонента
     * @param {boolean} getNext Возвращает следующий элемент после удаленной
     * @returns {null|Node}
     */
    static componentDelete(name, getNext = false) {
        const deleteComp = this.vnode.component.children[name];
        let el;
        if (getNext) el = deleteComp.element.nextSibling;
        this.vnode.component.removeChild(deleteComp, this.vnode.data.inserted, true);
        return el;
    }

    /**
     * Создание и вставка компонента по ключу
     * @param {string} key 
     * @param {Node} space Элемент, перед которой будет вставлено
     */
    static componentInsert(key, space) {
        const insertComp = this.data.component.clone(this.namePrefix + key, true, this.getObjectForCycle(this.data, key));
        this.vnode.component.insertChild(insertComp, space, this.vnode.data.inserted);
    }

    /**
     * Смена местами двух компонентов
     * @param {string} key1 
     * @param {string} key2 
     */
    static componentSwap(key1, key2) {
        const comp1 = this.vnode.component.children[this.namePrefix + key1];
        const comp2 = this.vnode.component.children[this.namePrefix + key2];
        this.vnode.component.swapChild(comp1, comp2);
        comp1.vars[this.data.as[1]||'key'] = key2;
        comp2.vars[this.data.as[1]||'key'] = key1;
    }

    /**
     * Сортировка компонентов по карте
     * @param {string[]} keys 
     */
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