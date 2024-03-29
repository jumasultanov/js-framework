import Directive from '../../Directive.js';
import { Helper, AreaProxy } from '../../Service.js';

class AreaExpanding {

    /**
     * Добавление скрытого метода для объекта, который возвращает оригинальный объект свойства
     * @param {object} vars Целевой объект
     */
    static setOrigin(vars) {
        Object.defineProperty(vars, 'getOrigin',
            Helper.getDescriptor(function(prop) {
                if (this.hasOwnProperty(prop)) return this;
                if (!this.__proto__.hasOwnProperty('getOrigin')) return null;
                return this.__proto__.getOrigin(prop);
            }, false, false, false)
        );
    }

    /**
     * Добавление скрытого метода для объекта, который возвращает объект зависимостей
     * @param {object} vars Целевой объект
     * @param {Dependency} dependency Объект зависимостей
     */
    static setHandler(vars, dependency) {
        Object.defineProperty(vars, 'getHandler',
            Helper.getDescriptor(() => dependency, false, false, false)
        );
    }

    /**
     * Добавление скрытого метода для объекта, который перебирается в цикле
     * @param {object} vars Родительский объект
     * @param {string} key Ключ
     */
    static setWatcher(vars, key) {
        if ('getWatcher' in vars[key]) return;
        Object.defineProperty(vars[key].__proto__, 'getWatcher', 
            Helper.getDescriptor(() => ({ vars, key }), false, false, false)
        );
    }

    /**
     * Добавление скрытого метода, который будет добавлять новое значение для объекта, откуда ее вызвали
     * @param {object} vars Целевой объект
     */
    static setCreate(vars) {
        //Добавляем скрытый метод добавления свойства
        const descriptorCreate = Helper.getDescriptor((prop, val, active = true) => {
            Object.defineProperty(vars, prop, Helper.getDescriptor(val, active, active, active));
            if (active) AreaProxy.one(vars, prop);
        }, false, false, false);
        Object.defineProperty(vars, '$create', descriptorCreate);
    }

    /**
     * Добавление скрытого метода, который будет вызывать наблюдателей для конкретного свойства
     * @param {object} vars 
     */
    static setUpdate(vars) {
        Object.defineProperty(vars, '$update', Helper.getDescriptor((prop, params) => {
            vars.getHandler().call(prop, Object.assign({ force: true }, params));
        }, false, false, false));
    }

    /**
     * Возвращает общий родительский объект с параметрами по умолчанию
     * @param {object} obj Объекта, для которого будет формироваться
     * @returns {object}
     */
    static getRoot(obj) {
        const isArray = Array.isArray(obj);
        const root = Object.create(Object.getPrototypeOf(obj));
        Object.defineProperty(root, 'isArray', Helper.getDescriptor(isArray, false, false, false));
        Object.defineProperty(root, 'isProxy', Helper.getDescriptor(true, false, false, false));
        return root;
    }
    
    /**
     * Добавление скрытого свойства для объекта
     * @param {object} target 
     * @param {string} key 
     * @param {any} value 
     */
    static set(target, key, value) {
        Object.defineProperty(target.__proto__, key,
            Helper.getDescriptor(value, true, true, false)
        );
    }

}

export default AreaExpanding