import Directive from '../../Directive.js';
import Component from '../../Component.js';
import { Directives, NodeElement } from '../../Service.js';

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
        if ('constrName' in data) {
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
            Directive.onName(this.data.constrName, 'onExecute', this);
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