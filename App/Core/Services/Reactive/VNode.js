import Directives from './Directives.js';
import Component from '../../Component.js';
import { NodeElement } from '../../Service.js';

class VNode {

    //HTML-элемент является текстом
    isText = false;
    //HTML-элемент содержит конструкцию
    isConstr = false;
    //Является элементом списка
    isListItem = false;
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
        if (Object.keys(data.constr||{}).length) this.isConstr = true;
        if (data.listExtension) this.isListItem = true;
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
     * 
     * @returns 
     */
    getSearchable() {
        if (!this.data.searchable) return null;
        return this.data.listExtension[this.data.searchable];
    }

    /**
     * 
     * @param {VNode} vnode 
     * @returns 
     */
    isEqualListItem(vnode) {
        const thisItem = this.getSearchable();
        const otherItem = vnode.getSearchable();
        if (thisItem === null || otherItem === null) return false;
        return thisItem === otherItem;
    }

    /**
     * 
     * @param {VNode} vnode 
     * @param {number[]} ignoreIndexes 
     * @returns 
     */
    getIndexListItem(vnode, ignoreIndexes) {
        for (const i in this.children) {
            if (ignoreIndexes?.includes(i)) continue;
            if (vnode.isEqualListItem(this.children[i])) return true;
        }
        return false;
    }

    /**
     * 
     * @param {VNode} vnode 
     */
    mergeListItem(vnode) {
        console.error('Merge VNode don`t work!', vnode);
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
        //if (this.data.constr.for) return this.constrFor();
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
            this.component.updateChildren([data.component], this);
        } else {
            //Флаг добавленности в Dependency, первый раз при изменении
            let used = false;
            //Выполнение выражения для условия
            Directives.expr(data.expr, data, this.getVars(), true, () => {
                //Если истинно,
                // то деактивируем функции в Dependency в последующих блоках конструкции и вставляем блок в DOM
                if (data.current) {
                    if (data.next) this.constrIfNextActive(data.next, false);
                    this.component.updateChildren([data.component], this);
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
                        this.component.updateChildren([], this);
                    }
                }
            });
        }
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
        this.ignoreSet = true;
        let data = this.data.constr.for;
        let expr = data.expr;
        let vars = data.vars;
        if (!vars) {
            if (expr.indexOf(' in ') < 0) {
                vars = [];
            } else {
                [vars, expr] = expr.split(' in ');
                vars = vars.replace(/[\(\)\s]/g, '').split(',');
                data.expr = expr;
            }
            data.vars = vars;
        }
        let val = Directives.expr(expr, data, this.getVars(), false);
        this.updateChildren(val);
        console.log(this);
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

}

export default VNode