import { LocalProxy } from './Service.js';

class Area {

    //Прокси объект глобальных переменных
    static globals;
    //Зарезирвированные слова
    static reservedWords = new Set(['vars', 'proxy']);

    /**
     * Возвращает прокси по ее пути
     * @param {string[]|string} path Путь до прокси
     * @returns {Proxy}
     */
    static find(path) {
        //Проверка
        path = this.checkPath(path);
        if (!path) return null;
        let current = this.globals;
        for (let item of path) {
            if (!(item in current)) {
                current[item] = this.empty(current.proxy);
            }
            current = current[item];
        }
        return {
            proxy: current.proxy,
            vars: current.vars
        };
    }

    /**
     * Возвращает пустой объект и его прокси
     * @param {Proxy} parentProxy 
     * @returns {object}
     */
    static empty(parentProxy = null) {
        const { proxy, vars } = LocalProxy.on({});
        if (parentProxy) proxy.__proto__ = parentProxy;
        return { proxy, vars };
    }

    /**
     * Проверка и разбиение, если формат строковый
     * @param {string[]|string} path Путь до области
     * @returns {string[]|false}
     */
    static checkPath(path) {
        if (!(path instanceof Array)) {
            if (typeof path == 'string') {
                if (path.indexOf('.') > -1) path = path.split('.');
                else path = [path];
            } else return false;
        }
        return path;
    }

    /**
     * Формируется прокси для объектов компонентов из globals страницы
     */
    static parseGlobals() {
        this.globals = window.globals;
        this.parseObjects(this.globals);
    }

    /**
     * Добавление данных из глобального объекта
     * @param {object} object 
     * @param {Proxy|null} parent 
     */
    static parseObjects(object, parent = null) {
        //Проверка объекта
        if (!(object instanceof Object)) return;
        if (object instanceof Array) return;
        if (!('vars' in object)) return;
        //Создание прокси и указание родителя
        const { proxy, vars } = LocalProxy.on(object.vars);
        if (parent) proxy.__proto__ = parent;
        object.proxy = proxy;
        object.vars = vars;
        //Проход по дочерним объектам
        for (const namespace in object) {
            if (this.reservedWords.has(namespace)) continue;
            this.parseObjects(object[namespace], proxy);
        }
    }

}

export default Area