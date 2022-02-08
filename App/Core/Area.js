import { LocalProxy, Dependency, Helper } from './Service.js';

class Area {

    //Прокси объект глобальных переменных
    static globals;
    //Зарезирвированные слова
    static reservedWords = new Set(['vars', 'proxy']);

    /**
     * Возвращает прокси по ее пути
     * @param {string[]|string} path Путь до прокси
     * @param {object|null} defaultVars Добавляемые доп. данные
     * @returns {object}
     */
    static find(path, defaultVars = null) {
        let current = this.findFull(path);
        if (!current) return null;
        //Добавляем доп. данные
        if (defaultVars instanceof Object) {
            for (const key in defaultVars) {
                Object.defineProperty(current.vars, key, Helper.getDescriptor(defaultVars[key]));
            }
        }
        return {
            proxy: current.proxy,
            vars: current.vars
        };
    }

    static getOwnKey(path, key) {
        //Проверка
        path = this.checkPath(path);
        if (!path) return null;
        let current = this.globals;
        let last = (current.hasOwnProperty(key) ? current : null);
        for (let item of path) {
            if (!(item in current)) break;
            current = current[item];
            if (current.hasOwnProperty(key)) last = current;
        }
        return last;
    }

    /**
     * Возвращает объект по пути
     * @param {string[]|string} path Путь до прокси
     * @returns {object}
     */
    static findFull(path) {
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
        return current;
    }

    static delete(path) {
        const area = Area.findFull(path.slice(0, -1));
        if (!area) return;
        delete area[path[path.length - 1]];
    }

    static move(oldPath, newPath) {
        const area = Area.findFull(oldPath.slice(0, -1));
        if (!area) return;
        const oldName = oldPath[oldPath.length - 1];
        const newName = newPath[newPath.length - 1];
        const move = area[newName];
        area[newName] = area[oldName];
        area[oldName] = move;
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
        if (!parent) Dependency.define(vars);
        //Проход по дочерним объектам
        for (const namespace in object) {
            if (this.reservedWords.has(namespace)) continue;
            this.parseObjects(object[namespace], proxy);
        }
    }

}

export default Area