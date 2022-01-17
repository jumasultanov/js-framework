import Directives from './Directives.js';

class LocalProxy {

    static deps = {};
    
    /**
     * Возвращает прокси для объекта
     * @param {object} obj Проксируемый объект
     * @returns {Proxy}
     */
    static on(obj) {
        /**
         * TODO:
         *      Что то сделать для вложенных объектов и объектов моделей
         */
        return new Proxy(obj, this);
    }

    /**
     * Проксирует объект и добавляет его в родительский прокси объект
     * @param {object} obj Проксируемый объект
     * @param {Proxy} parentProxy Родительский прокси
     */
    static extends(obj, parentProxy) {
        obj = this.on(obj);
        obj.__proto__ = parentProxy;
        return obj;
    }

    static get(target, prop, receiver) {
        if (typeof prop != 'symbol') {
            console.log(`GET ${prop}`);
            /**
             * TODO:
             *  Продумать ловлю изменении в конкретном месте относительно virtual DOM,
             *  который надо будет сделать
             */
            if (Directives.$dep) {
                if (!this.deps[prop]) this.deps[prop] = [];
                this.deps[prop].push(Directives.$dep);
            }
        }
        return Reflect.get(target, prop, receiver);
    }
    
    static set(target, prop, val, receiver) {
        //Выполняем изменение значения
        let result = Reflect.set(target, prop, val, receiver);
        //Если указывает родительский объект
        if (prop == '__proto__') return result;
        
        console.log(`SET ${prop} = ${val}`, target);
        //
        if (!prop.startsWith('$') && this.deps[prop]) {
            for (const dep of this.deps[prop]) dep(val);
        }
        return result;
    }

    // TODO:
    // Add another catcher functions

}

export default LocalProxy