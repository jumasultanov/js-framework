import Directives from './Directives.js';
import VDOM from './VDOM.js';
import { NodeElement } from '../../Service.js';

class VNode {

    //HTML-элемент является текстом
    isText = false;
    //HTML-элемент содержит конструкцию
    isConstr = false;
    //Является элементом списка
    isListItem = false;
    //HTML-элемент
    node;
    //Параметры элемента
    data;
    //Вложенные объекты VNode[]
    children = [];
    //Объект VDOM, в котором содержится текущий экземпляр VNode
    vdom;

    constructor(node, data) {
        this.node = new NodeElement(node);
        this.isText = this.node.isText();
        if (Object.keys(data.constr||{}).length) this.isConstr = true;
        if (data.listExtension) this.isListItem = true;
        this.data = data;
    }

    /**
     * Устанавливается объект VDOM
     * @param {VDOM} vdom 
     * @returns {this}
     */
    setVDOM(vdom) {
        this.vdom = vdom;
        return this;
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
     * Делаем объекты вложенными
     * @param {VNode[]} vnodes
     */
    addChildren(vnodes, vdom) {
        for (const vnode of vnodes) {
            this.children.push(vnode);
            vnode.setVDOM(vdom);
        }
    }

    /**
     * Возвращает объект с данными
     * @returns {object}
     */
    getVars() {
        if (this.vdom instanceof VDOM) return this.vdom.getVars();
        else return null;
    }

    /**
     * Вычисляем выражения и отслеживаем изменения
     * @returns {VNode|null}
     */
    setDirectives() {
        let result = this;
        if (this.isText) {
            this.setText();
        } else {
            this.ignoreSet = false;
            if (this.isConstr) {
                result = this.tryConstr();
            }
            if (!this.ignoreSet) {
                this.setEvents();
                this.setAttributes();
                this.setStyles();
                this.setClasses();
                this.setProperties();
            }
        }
        return result;
    }

    /**
     * Обновляем DOM для элемента
     */
    /*update() {

    }*/

    /**
     * 
     */
    setEvents() {
        for (const name in this.data.on) {
            const data = this.data.on[name];
            Directives.exec('on', this.node, name, data.expr, this.getVars());
        }
    }

    /**
     * 
     */
    setAttributes() {
        // TO CONTINUE: 
        // Сделать обновление после реактивного изменения
        // Рассмотреть вариант, когда массовое изменение или рекурсивное изменение
        // не должно обрабатываться несколько раз
        for (const name in this.data.attrs) {
            const data = this.data.attrs[name];
            Directives.expr(data.expr, this.getVars(), data, true, () => {
                this.node.attr(name, data.current);
            });
        }
    }

    /**
     * 
     */
    setStyles() {
        /*for (const name in this.data.style) {
            const data = this.data.style[name];
            Directives.exec('bind', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * 
     */
    setClasses() {
        /*for (const name in this.data.class) {
            const data = this.data.class[name];
            Directives.exec('bind', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * 
     */
    setProperties() {
        /*for (const name in this.data.props) {
            const data = this.data.props[name];
            Directives.exec('prop', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * 
     */
    setText() {
        let data = this.data;
        Directives.expr(data.expr, this.getVars(), data, true, () => {
            this.node.text(data.current);
        });
    }

    /**
     * 
     * @returns {VNode|null}
     */
    tryConstr() {
        if (this.isConstr) {
            //Условия
            if (this.data.constr.if) return this.constrIf();
            if (this.data.constr['else-if']) return this.constrIf(true);
            //Циклы
            //if (this.data.constr.for) return this.constrFor();
            // TODO: другие конструкции
        }
        return this;
    }

    /**
     * 
     * @param {boolean} next 
     * @returns {VNode|null}
     */
    constrIf(next = false) {
        let data = next ? this.data.constr['else-if'] : this.data.constr.if;
        let success = !!Directives.expr(data.expr, this.getVars(), data);
        data.current = success;
        if (success) return this;
        this.ignoreSet = true;
        if (data.next instanceof VNode) {
            data.next.setDirectives();
            return data.next;
        }
        return null;
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
        let val = Directives.expr(expr, this.getVars(), data, false);
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