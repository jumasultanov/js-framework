import Basic from './Directives/Basic.js';
import If from './Directives/If.js';
import For from './Directives/For.js';

class Directive {

    /**
     * Регистрация директив
     */
    static boot() {
        this.listen(Basic).listen(If).listen(For);
    }

    /**
     * Добавление слушателей из директивы
     * @param {Class} directive Класс директивы
     * @returns {this}
     */
    static listen(directive) {
        if ('boot' in directive) directive.boot();
        return this;
    }

    /**
     * Удаление слушателей директивы
     * @param {Class} directive Класс директивы
     * @returns {this}
     */
    static removeListener(directive) {
        for (prop of Object.keys(this)) this.exclude(prop, directive);
        return this;
    }

    /**
     * Включение в список класс слушателя
     * @param {string} prop Название списка
     * @param {Class} directive Класс директивы
     * @returns {this}
     */
    static include(prop, directive) {
        if (!this[prop]) this[prop] = {};
        this[prop][directive.name] = directive;
        return this;
    }

    /**
     * Удаление из списка класс слушателя
     * @param {string} prop Название списка
     * @param {Class} directive Класс директивы
     * @returns {this}
     */
    static exclude(prop, directive) {
        if (this[prop] && directive.name in this[prop]) {
            delete this[prop][directive.name];
            if (Object.keys(this[prop]).length === 0) this[prop] = undefined;
        }
        return this;
    }

    /**
     * Триггер события для директив всего списка
     * @param {string} prop Название списка
     * @returns {any}
     */
    static on(prop, ...args) {
        if (this[prop]) {
            for (const name in this[prop]) {
                const directive = this[prop][name];
                const result = directive[prop].apply(directive, args);
                if (result !== undefined) return result;
            }
        }
    }

    /**
     * Триггер события для одного элемента списка
     * @param {string} name Название элемента
     * @param {string} prop Название списка
     * @returns {any}
     */
    static onName(name, prop, ...args) {
        if (this[prop] && this[prop][name]) {
            return this[prop][name][prop].apply(this[prop][name], args);
        }
    }

}


export default Directive