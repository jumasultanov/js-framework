import { Helper, LocalProxy, Dependency } from '../../Service.js';

class InternalProxy {

    static ARRAY_PUSH = 0;
    static ARRAY_DELETE = 1;
    static ARRAY_MOVE = 2;
    static ARRAY_REVERSE = 3;
    static ARRAY_SORT = 4;

    /**
     * Преобразует объекты в прокси с дочерними объектами
     * @param {object} vars Проксируемый объект
     */
    static on(vars) {
        if (!(vars instanceof Object)) return;
        for (const key in vars) this.one(vars, key);
    }

    static one(vars, key) {
        if (vars[key] instanceof Object && typeof vars[key] == 'object') {
            const item = vars[key];
            //Если объект уже спроксирован, то не трогаем его и не проходимся по вложенным объектам
            if ('isProxy' in item) return;
            this.on(item);
            item.__proto__ = this.getRoot(item);
            Dependency.define(item, false);
            vars[key] = new Proxy(item, LocalProxy);
        }
    }

    static setWatcher(vars, key) {
        //TODO: 
        // Продумать момент, когда один и тот же массив или объект перебирается в двух и более местах
        Object.defineProperty(vars[key].__proto__, 'getWatcher', 
            Helper.getDescriptor(() => ({ vars, key }), false, false, false)
        );
    }

    static setCreate(vars) {
        //Добавляем скрытый метод добавления свойства
        const descriptorCreate = Helper.getDescriptor((prop, val) => {
            Object.defineProperty(vars, prop, Helper.getDescriptor(val));
        }, false, false, false);
        Object.defineProperty(vars, '$create', descriptorCreate);
    }

    /**
     * Возвращает общий родительский объект с параметрами по умолчанию
     * @param {object} obj Объекта, для которого будет формироваться
     * @returns {object}
     */
    static getRoot(obj) {
        if (obj instanceof Array) return this.getRootByType('rootArray', true);
        return this.getRootByType('rootObject', false);
    }

    /**
     * Возвращает объект с параметрами по умолчанию для определенного типа данных
     * @param {string} prop Свойство в классе для хранения
     * @param {boolean} isArray Является ли массивом
     * @returns {object}
     */
    static getRootByType(prop, isArray) {
        if (!this[prop]) {
            this[prop] = isArray ? [] : {};
            Object.defineProperty(this[prop], 'isArray', Helper.getDescriptor(isArray, false, false, false));
            Object.defineProperty(this[prop], 'isProxy', Helper.getDescriptor(true, false, false, false));
        }
        return this[prop];
    }

    static arrayChange(target, index, change) {
        const root = target.getWatcher();
        root.vars.getHandler().call(root.key, {
            force: true,
            change, index
        }, true);
    }

}

export default InternalProxy