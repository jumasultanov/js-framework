import Directive from "../Directive.js";
import { Executor, Dependency } from "../Service.js";

class Basic {

    //Название конструкции
    static name = 'basic';
    //Для извлечения выражении события
    static methodNameExpression = /^[a-z][\w\.]*$/i;

    /**
     * Регистрация директивы
     */
    static boot() {
        //Добавляем слушателей на события
        Directive
            .include('onParse', this)
            .include('onParseEvent', this)
            .include('onParseText', this)
            .include('onExecute', this)
            .include('onDestroy', this);
    }

    /**
     * Событие при парсинге атрибута
     * @param {Node} node Элемент
     * @param {string} attr Атрибут
     * @param {string} value Значение атрибута
     * @param {object} data Данные конструкции
     */
    static onParse(node, attr, value, data) {
        if (attr == 'style') {
            // TODO: parse style json for object
            data.style = value;
        } else if (attr == 'class') {
            // TODO: parse class json for object
            data.class = value;
        } else if (attr in node) {
            data.props[attr] = { expr: value };
        } else data.attrs[attr] = { expr: value };
    }

    /**
     * Событие при парсинге события
     * @param {string} attr Атрибут
     * @param {string} value Значение атрибута
     * @param {object} data Данные конструкции
     */
    static onParseEvent(attr, value, data) {
        value = value.trim();
        if (this.methodNameExpression.test(value)) {
            value += '(event)';
        }
        data.on[attr] = { expr: value/*, mods: []*/ };
    }

    /**
     * Событие при парсинге текста
     * @param {Node} node Элемент
     * @param {RegExp} regExp Регулярное выражение для конструкции в тексте
     * @returns {false|object}
     */
    static onParseText(node, regExp) {
        let items = [];
        let split = [];
        let end = false;
        let str = node.textContent;
        for (const match of str.matchAll(regExp)) {
            //Pre text
            if (split.length == 0 && match.index > 0) split.push(new Text(match.input.substring(0, match.index)));
            //Between text after prev
            if (end && match.index > end) split.push(new Text(match.input.substring(end, match.index)));
            //Set end index
            end = match.index + match[0].length;
            //Add expression
            const text = new Text(match.input.substring(match.index, end));
            const value = text.textContent.substring(2, match[0].length - 2);
            const data = { expr: value, transform: this.transformText };
            items.push({ text, data });
            split.push(text);
        }
        if (!split.length) return false;
        //Suffix text
        if (end !== false && end < str.length) split.push(new Text(str.substring(end)));
        //Insert cutting
        for (const text of split) node.parentNode.insertBefore(text, node);
        node.parentNode.removeChild(node);
        const lastElement = split[split.length - 1];
        return { items, lastElement };
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
     * Событие при активации конструкции
     * @param {VNode} vnode 
     */
    static onExecute(vnode) {
        if (vnode.isText) {
            this.setText(vnode);
        } else {
            this.setEvents(vnode);
            this.setAttributes(vnode);
            this.setStyles(vnode);
            this.setClasses(vnode);
            this.setProperties(vnode);
        }
    }

    /**
     * Событие при уничтожении конструкции
     * @param {VNode} vnode 
     */
    static onDestroy(vnode) {
        this.setEvents(vnode, true);
    }

    /**
     * Установка текста
     * @param {VNode} vnode 
     */
    static setText(vnode) {
        let data = vnode.data;
        Executor.expr(data.expr, data, vnode.getVars(), false, () => {
            vnode.node.text(data.current);
        });
    }

    /**
     * Установка событии
     * @param {VNode} vnode 
     * @param {boolean} remove Нужно ли удалить
     */
    static setEvents(vnode, remove = false) {
        for (const name in vnode.data.on) {
            if (remove) this.unsetEvent(name, vnode);
            else this.setEvent(name, vnode);
        }
    }

    /**
     * Установка события
     * @param {string} name Название события
     * @param {VNode} vnode 
     */
    static setEvent(name, vnode) {
        // TODO: добавить режимы для событии, пример: @click.prevent="click"
        const data = vnode.data.on[name];
        vnode.node.getNode().addEventListener(name, data.handler = event => {
            Dependency.startCall();
            Executor.call(data.expr, vnode.getVars(), true);
            Dependency.endCall();
        });
    }

    /**
     * Удаление события
     * @param {string} name Название события
     * @param {VNode} vnode 
     */
    static unsetEvent(name, vnode) {
        const data = vnode.data.on[name];
        vnode.node.getNode().removeEventListener(name, data.handler);
        delete data.handler;
    }

    /**
     * Установка атрибутов
     */
    static setAttributes(vnode) {
        for (const name in vnode.data.attrs) {
            const data = vnode.data.attrs[name];
            Executor.expr(data.expr, data, vnode.getVars(), false, () => {
                vnode.node.attr(name, data.current);
            });
        }
    }

    /**
     * Установка стилей
     */
    static setStyles(vnode) {
        /*for (const name in this.data.style) {
            const data = this.data.style[name];
            Executor.exec('bind', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * Установка классов
     */
    static setClasses(vnode) {
        /*for (const name in this.data.class) {
            const data = this.data.class[name];
            Executor.exec('bind', this.node, name, data, this.getVars());
        }*/
    }

    /**
     * Установка свойств
     */
    static setProperties(vnode) {
        for (const name in vnode.data.props) {
            const data = vnode.data.props[name];
            Executor.expr(data.expr, data, vnode.getVars(), false, () => {
                vnode.node.prop(name, data.current);
            });
        }
    }

}

export default Basic