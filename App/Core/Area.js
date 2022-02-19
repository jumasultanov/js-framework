import { LocalProxy, InternalProxy, Dependency, Helper } from './Service.js';

class Area {

    //Прокси объект глобальных переменных
    static globals;
    //Зарезирвированные слова
    static reservedWords = new Set(['vars', 'proxy']);
    //Иденксы для генерации названии переменных
    static genIndex = 1;

    /**
     * Возвращает прокси по ее пути
     * @param {string[]|string} path Путь до прокси
     * @param {object|null} defaultVars Добавляемые доп. данные
     * @returns {object}
     */
    static find(path, defaultVars = null) {
        //Получаем область по пути
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

    /**
     * Возвращает последнюю найденную область в пути, где присутствует ключ
     * @param {string[]|string} path Путь
     * @param {string} key Ключ
     * @returns {object}
     */
    static getOwnKey(path, key) {
        //Проверка
        path = this.checkPath(path);
        if (!path) return null;
        let current = this.globals;
        let last = (current.vars.hasOwnProperty(key) ? current : null);
        for (let item of path) {
            if (!(item in current)) break;
            current = current[item];
            if (current.vars.hasOwnProperty(key)) last = current;
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

    /**
     * Добавляем в область новое свойство
     * @param {string[]|string} path Путь
     * @param {string|false} key Название свойства, иначе сгенерируется
     * @param {any} value Значение
     * @returns {object}
     */
    static define(path, key, value) {
        if (!key) {
            //Генерируем новое название
            key = `_variable${this.genIndex}`;
            this.genIndex++;
        }
        //Получаем область из пути, добавляя переданное свойство
        let area = Area.find(path, {
            [key]: value
        });
        //Проксируем объекты
        InternalProxy.one(area.vars, key);
        return {
            target: area.vars,
            prop: key,
            value: area.vars[key]
        }
    }

    /**
     * Удаляет область данных по пути
     * @param {string[]|string} path Путь
     */
    static delete(path) {
        const area = Area.findFull(path.slice(0, -1));
        if (!area) return;
        delete area[path[path.length - 1]];
    }

    /**
     * Меняет ключи местами для двух путей, должны лежать в одной области
     * @param {string[]|string} path1 
     * @param {string[]|string} path2 
     */
    static move(path1, path2) {
        const area = Area.findFull(path1.slice(0, -1));
        if (!area) return;
        const oldName = path1[path1.length - 1];
        const newName = path2[path2.length - 1];
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