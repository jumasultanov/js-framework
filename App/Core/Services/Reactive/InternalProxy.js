import { Helper, LocalProxy, Dependency } from '../../Service.js';

class InternalProxy {

    /**
     * Преобразует объекты в прокси с дочерними объектами
     * @param {object} vars Проксируемый объект
     */
    static on(vars) {
        if (!(vars instanceof Object)) return;
        for (const key in vars) this.one(vars, key);
    }

    /**
     * Преобразует объект и дочерние объекты в прокси 
     * @param {object} vars 
     * @param {string} key 
     */
    static one(vars, key) {
        if (vars[key] instanceof Object && typeof vars[key] == 'object') {
            const item = vars[key];
            //Если объект уже спроксирован, то не трогаем его и не проходимся по вложенным объектам
            if ('isProxy' in item) return;
            //Проксируем сначала дочерние
            this.on(item);
            //Добавляем скрытые предустановочные свойства
            item.__proto__ = this.getRoot(item);
            Dependency.define(item, false);
            vars[key] = new Proxy(item, LocalProxy);
        }
    }

    /**
     * Добавляем скрытый метод для объекта, который перебирается в цикле
     * @param {object} vars Родительский объект
     * @param {string} key Ключ
     */
    static setWatcher(vars, key) {
        //TODO: 
        // Продумать момент, когда один и тот же массив или объект перебирается в двух и более местах
        Object.defineProperty(vars[key].__proto__, 'getWatcher', 
            Helper.getDescriptor(() => ({ vars, key }), false, false, false)
        );
    }

    /**
     * Добавляем скрытый метод, который будет добавлять новое значение для объекта, откуда ее вызвали
     * @param {object} vars Целевой объект
     */
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
        const isArray = obj instanceof Array;
        const root = isArray ? [] : {};
        Object.defineProperty(root, 'isArray', Helper.getDescriptor(isArray, false, false, false));
        Object.defineProperty(root, 'isProxy', Helper.getDescriptor(true, false, false, false));
        return root;
    }
    
    static setIterating(target) {
        Object.defineProperty(target.__proto__, 'iterating', Helper.getDescriptor(true, true, true, false));
    }

}

export default InternalProxy