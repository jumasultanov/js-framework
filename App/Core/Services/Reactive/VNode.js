import Directive from '../../Directive.js';
import Component from '../../Component.js';
import { NodeElement } from '../../Service.js';

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
     * Возвращает объект с данными
     * @returns {object|null}
     */
    getVars() {
        if (this.component instanceof Component) return this.component.getVars();
        else return null;
    }

    /**
     * Вычисляем выражения и отслеживаем изменения
     */
    setDirectives() {
        if (this.isConstr) {
            Directive.onName(this.data.constrName, 'onExecute', this);
        } else {
            Directive.onName('basic', 'onExecute', this);
        }
    }

    /**
     * Отключаем директивы
     */
    unsetDirectives() {
        if (this.isConstr) {
            Directive.onName(this.data.constrName, 'onDestroy', this);
        } else {
            Directive.onName('basic', 'onDestroy', this);
        }
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
        };
    }

}

export default VNode