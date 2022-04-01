import Directive from "../Directive.js";
import { Executor, Dependency, StrParser, Transform } from "../Service.js";
import Model from "./Model.js";

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
     * @param {string[]|null} modes Режимы
     * @param {object} data Данные конструкции
     */
    static onParse(node, attr, value, modes, data) {
        const obj = { expr: value, modes };
        //Если указан список стилей
        if (attr == 'style') {
            data.style = obj;
            data.styleInserted = new Set();
            return;
        }
        //Если указан список классов
        if (attr == 'class') {
            data.class = obj;
            data.classInserted = new Set();
            return;
        }
        //Если указана связка значении value
        if (attr == Model.name) {
            data.model = obj;
            Model.modes(node, obj);
            return;
        }
        //Если есть свойство Node элемента
        if (attr in node) return data.props[attr] = obj;
        //Иначе это атрибут элемента
        data.attrs[attr] = obj;
    }

    /**
     * Событие при парсинге события
     * @param {string} attr Атрибут
     * @param {string} value Значение атрибута
     * @param {string[]|null} modes Режимы
     * @param {object} data Данные конструкции
     */
    static onParseEvent(attr, value, modes, data) {
        value = value.trim();
        if (this.methodNameExpression.test(value)) {
            value += '(event)';
        }
        data.on[attr] = { expr: value, modes };
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
            const data = { expr: value, transform: Transform.text };
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
            Model.set(vnode);
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
     * @param {VNode} vnode 
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
     * Установка свойств
     * @param {VNode} vnode 
     */
    static setProperties(vnode) {
        for (const name in vnode.data.props) {
            const data = vnode.data.props[name];
            Executor.expr(data.expr, data, vnode.getVars(), false, () => {
                vnode.node.prop(name, data.current);
            });
        }
    }

    /**
     * Установка классов
     * @param {VNode} vnode 
     */
    static setClasses(vnode) {
        if (vnode.data.class) {
            const data = vnode.data.class;
            //Добавляем метода добавления класса
            data.add = name => {
                vnode.node.addClass(name);
                vnode.data.classInserted.add(name);
            }
            //Добавляем метода удаления класса
            data.remove = name => {
                vnode.node.removeClass(name);
                vnode.data.classInserted.delete(name);
            }
            this.setMultiple(vnode, data, vnode.data.classInserted);
        }
    }

    /**
     * Установка стилей
     * @param {VNode} vnode 
     */
    static setStyles(vnode) {
        if (vnode.data.style) {
            const data = vnode.data.style;
            //Добавляем метода добавления стиля
            data.add = (name, value) => {
                vnode.node.addStyle(name, value);
                vnode.data.styleInserted.add(name);
            }
            //Добавляем метода удаления стиля
            data.remove = name => {
                vnode.node.removeStyle(name);
                vnode.data.styleInserted.delete(name);
            }
            this.setMultiple(vnode, data, vnode.data.styleInserted);
        }
    }

    /**
     * Установка свойств на элемент
     * @param {VNode} vnode 
     * @param {object} data 
     * @param {Set} inserted 
     */
    static setMultiple(vnode, data, inserted) {
        //Убираем пробелы с концов
        let expr = data.expr.trim();
        //Если это инлайн объект, то парсим его
        if (expr.startsWith('{')) {
            StrParser.match(expr, (key, valueExpr) => {
                if (key.startsWith('"') || key.startsWith("'")) key = key.slice(1, -1);
                this.setOne(data, vnode.getVars(), valueExpr, key);
            });
        } else {
            Executor.expr(data.expr, data, vnode.getVars(), false, () => {
                //Контроль вставленных свойств
                if (inserted) {
                    for (const name of inserted) data.remove(name);
                }
                if (data.current instanceof Object) {
                    //Устанавливаем наблюдателей при добавлении и удалении в объекте
                    data.current.getHandler().addObjectWatchers(changeParams => {
                        //Добавляем наблюдателя за свойством
                        this.setOne(data, data.current, `this['${changeParams.prop}']`, changeParams.prop);
                    }, changeParams => {
                        //Удаляем свойство и его наблюдателя
                        data.remove(changeParams.prop);
                        data.current.getHandler().removeProp(changeParams.prop);
                    });
                    //Устанавливаем свойства
                    for (const name in data.current) this.setOne(data, data.current, `this['${name}']`, name);
                }
            });
        }
    }

    /**
     * Установка свойства на элемент
     * @param {object} data 
     * @param {object} ctx Объект, откуда берутся свойства и значения
     * @param {string} expr Выражение, которое надо вычислять
     * @param {string} name Название свойства, которое будет меняться для элемента
     */
    static setOne(data, ctx, expr, name) {
        //Формируем объект для класса элемента
        const internalData = { expr };
        internalData.__proto__ = data;
        Executor.expr(internalData.expr, internalData, ctx, false, () => {
            //Добавляем или удаляем класс или стиль в зависимости от значения
            if (internalData.current) data.add(name, internalData.current);
            else data.remove(name);
        });
    }

}

export default Basic