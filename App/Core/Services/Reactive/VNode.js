import Directives from './Directives.js';
import Component from '../../Component.js';
import Area from '../../Area.js';
import { NodeElement, Block, InternalProxy } from '../../Service.js';

class VNode {

    //HTML-элемент является текстом
    isText = false;
    //HTML-элемент содержит конструкцию
    isConstr = false;
    //Объект NodeElement
    node;
    //Параметры элемента
    data;
    //Компонент
    component;

    constructor(node, component, data) {
        this.node = new NodeElement(node);
        this.component = component;
        this.isText = this.node.isText();
        if (Object.keys(data.constr||{}).length) {
            this.isConstr = true;
            data.inserted = new Set();
        }
        this.data = data;
    }

    /**
     * Является ли элемент конструкцией
     * @returns bool
     */
    hasConstr() {
        return this.isConstr;
    }

    /**
     * Возвращает объект с данными
     * @returns {object}
     */
    getVars() {
        if (this.component instanceof Component) return this.component.getVars();
        else return null;
    }

    /**
     * Вычисляем выражения и отслеживаем изменения
     * @returns {VNode|null}
     */
    setDirectives() {
        if (this.isText) {
            this.setText();
        } else if (this.isConstr) {
            this.setConstr();
        } else {
            this.setEvents();
            this.setAttributes();
            this.setStyles();
            this.setClasses();
            this.setProperties();
        }
    }

    /**
     * Установка событии
     */
    setEvents() {
        for (const name in this.data.on) {
            const data = this.data.on[name];
            Directives.exec('on', this.node, name, data.expr, this.getVars());
        }
    }

    /**
     * Установка атрибутов
     */
    setAttributes() {
        for (const name in this.data.attrs) {
            const data = this.data.attrs[name];
            Directives.expr(data.expr, data, this.getVars(), false, () => {
                this.node.attr(name, data.current);
            });
        }
    }

    /**
     * Установка стилей
     */
    setStyles() {
        /*for (const name in this.data.style) {
            const data = this.data.style[name];
            Directives.exec('bind', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * Установка классов
     */
    setClasses() {
        /*for (const name in this.data.class) {
            const data = this.data.class[name];
            Directives.exec('bind', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * Установка свойств
     */
    setProperties() {
        /*for (const name in this.data.props) {
            const data = this.data.props[name];
            Directives.exec('prop', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * Установка текста
     */
    setText() {
        let data = this.data;
        Directives.expr(data.expr, data, this.getVars(), false, () => {
            this.node.text(data.current);
        });
    }

    /**
     * Выполняем конструкции
     */
    setConstr() {
        //Условия
        if (this.data.constr.if) this.constrIf();
        //Циклы
        if (this.data.constr.for) return this.constrFor();
        // TODO: другие конструкции
    }

    /**
     * Выполнение конструкции IF
     * @param {boolean} next Имя следующего блока конструкции
     */
    constrIf(next = 'if') {
        //Получаем данные
        let data = this.data.constr[next];
        //Если дошли до ELSE, то без проверок выполняем вставку
        if (data.name == 'else') {
            this.component.replaceChildren([data.component], this.data.space, this.data.inserted);
        } else {
            //Флаг добавленности в Dependency, первый раз при изменении
            let used = false;
            //Выполнение выражения для условия
            Directives.expr(data.expr, data, this.getVars(), true, () => {
                //Если истинно,
                // то деактивируем функции в Dependency в последующих блоках конструкции и вставляем блок в DOM
                if (data.current) {
                    if (data.next) this.constrIfNextActive(data.next, false);
                    this.component.replaceChildren([data.component], this.data.space, this.data.inserted);
                } else {
                    if (data.next) {
                        if (used) {
                            //Активируем следующие функции в Dependency в последующих блоках конструкции
                            this.constrIfNextActive(data.next);
                        } else {
                            //Впервые дошли до выполнения следующего условия конструкции
                            used = true;
                            this.constrIf(data.next);
                        }
                    } else {
                        //Пустой блок, если ни одно условие не выполнилось и нет ELSE
                        this.component.replaceChildren([], this.data.space, this.data.inserted);
                    }
                }
            });
        }
    }

    /**
     * Изменение активности функции в Dependency
     * @param {string} next Имя следующего блока конструкции
     * @param {boolean} enable Включить или отключить
     */
    constrIfNextActive(next, enable = true) {
        let data = this.data.constr[next];
        //Значение изменяем
        if (enable) data.current = false;
        if ('dependencies' in data) {
            for (const prop in data.dependencies) {
                //После проверок перебираем и изменяем активность функции
                for (const index of data.dependencies[prop]) {
                    this.component.dependency.setActive(prop, index, enable);
                }
            }
        }
        //Проходимся по следующим блокам
        if (data.next) this.constrIfNextActive(data.next, enable);
    }

    /**
     * 
     * @returns {VNode}
     */
    constrFor() {
        let data = this.data.constr.for;
        const namePrefix = `${data.component.name}:`;
        //Выполнение выражения для цикла
        Directives.expr(data.expr, data, this.getVars(), false, params => {
            console.warn('ARRAY CHANGE', data);
            console.warn(params);
            const count = data.current.length;
            let forElse;
            if (data.next) forElse = this.data.constr[data.next];
            if (data.current instanceof Object) {
                if (count && forElse && forElse.component.isActive()) {
                    this.component.removeChild(forElse.component);
                }
                if (params && 'change' in params) {
                    const key = params.index;
                    switch (params.change) {
                        case InternalProxy.ARRAY_PUSH:
                            const replaceComp = this.component.children[namePrefix + key];
                            let before;
                            if (replaceComp) {
                                before = replaceComp.element.nextSibling;
                                this.component.removeChild(replaceComp, this.data.inserted, true);
                            }
                            if (!before) before = this.data.space;
                            const insertComp = data.component.clone(namePrefix + key, true, VNode.getObjectForCycle(data, key));
                            this.component.insertChild(insertComp, before, this.data.inserted);
                            return;
                        case InternalProxy.ARRAY_MOVE:
                            const removeComp = this.component.children[namePrefix + key.value];
                            const moveComp = this.component.children[namePrefix + key.replace];
                            console.log('MOVE', moveComp);
                            console.log('OLD', removeComp);
                            this.component.swapChild(moveComp, removeComp);
                            const oldKey = moveComp.vars[data.as[1]||'key'];
                            moveComp.vars[data.as[1]||'key'] = key.value;
                            removeComp.vars[data.as[1]||'key'] = oldKey;
                            return;
                        case InternalProxy.ARRAY_REVERSE:
                            for (let i = 0; i < key.length; i += 2) {
                                const first = key[i];
                                const second = key[i + 1];
                                const comp1 = this.component.children[namePrefix + first];
                                const comp2 = this.component.children[namePrefix + second];
                                console.log('FIRST', comp1);
                                console.log('SECOND', comp2);
                                this.component.swapChild(comp1, comp2);
                                comp1.vars[data.as[1]||'key'] = second;
                                comp2.vars[data.as[1]||'key'] = first;
                            }
                            return;
                        case InternalProxy.ARRAY_SORT:
                            let tempComps = {};
                            let tempAreas = {};
                            const areas = Area.findFull(data.component.path.slice(0, -1));
                            for (let i = 0; i < key.length; i++) {
                                const name = namePrefix + key[i];
                                const value = data.current[key[i]];
                                for (let j = 0; j < key.length; j++) {
                                    if (i === j) continue;
                                    const foundName = namePrefix + key[j];
                                    const comp = this.component.children[foundName];
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
                                this.component.children[name] = tempComps[name];
                                areas[name] = tempAreas[name];
                            }
                            let names = [];
                            for (let index in data.current) names.push(data.component.name + ':' + index);
                            this.component.collectChildrenBlocks(names, this.data.space);
                            return;
                        case InternalProxy.ARRAY_DELETE:
                            //Удаляем компонент из родителя и его данные
                            const deleteComp = this.component.getChildren()[namePrefix + key];
                            console.log('OLD', deleteComp);
                            this.component.removeChild(deleteComp, this.data.inserted, true);
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
                            const component = data.component.clone(name, true, VNode.getObjectForCycle(data, key));
                            this.component.insertChild(component, this.data.space, this.data.inserted);
                        }
                        return;
                    }
                }
            }
            if (forElse) {
                //Если нет данных в списке, то выполняем конструкцию ELSE
                this.component.replaceChildren([forElse.component], this.data.space, this.data.inserted);
            }
        });
        return this;
    }

    /**
     * Возвращает объект-заготовку для параметров элемента
     * @returns {object}
     */
    static getEmptyData() {
        return {
            on: {}, //События
            attrs: {}, //Атрибуты
            style: null, //Стили
            class: null, //Классы
            props: {}, //Свойства элемента
            constr: {}, //Конструкции
            space: null, //Замененный коммент на блок
        };
    }

    /**
     * Преобразование значении для условии IF
     * @param {any} value Значение
     * @returns {boolean}
     */
    static transformIf(value) {
        return !!value;
    }

    /**
     * Преобразование значении в текст
     * @param {any} value Значение
     * @returns {string}
     */
    static transformText(value) {
        if (typeof value != 'string') {
            if (value) {
                if (value instanceof Object) value = JSON.stringify(value);
                else value = String(value);
            } else value = '';
        }
        return value;
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

export default VNode