import Directives from './Directives.js';

class LocalProxy {

    static deps = {};
    //static counter = 0;
    
    /**
     * Возвращает прокси для объекта
     * @param {object} vars Проксируемый объект
     * @returns {Proxy}
     */
    static on(vars) {
        // TODO: нужно для вложенных объектов сделать прокси
        const proxy = new Proxy(vars, this);
        return { proxy, vars };
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
            // TODO: Продумать ловлю изменении в конкретном месте относительно virtual DOM,
            //       который надо будет сделать
            if (Directives.$dep) {
                console.log(`GET ${prop}`);
                if (!this.deps[prop]) this.deps[prop] = [];
                this.deps[prop].push(Directives.$dep);
            }
        }
        return Reflect.get(target, prop, receiver);
    }
    
    static set(target, prop, val, receiver) {
        //Для установки радительского Proxy объекта
        if (prop == '__proto__') {
            /*console.warn('SET PROTO');
            console.warn('TARGET', target);
            console.warn('VALUE', val);
            console.warn('RC', receiver);*/
            target.__proto__ = val;
            return true;
        }
        //console.log(prop, target);
        if (target.hasOwnProperty([prop])) {
            // TODO: 
            Reflect.set(target, prop, val, receiver);
            if (this.deps[prop]) {
                console.log(`SET ${prop} = ${val}`);
                for (const dep of this.deps[prop]) dep(val);
            }
            return true;
        } else {
            //return Reflect.set(target.__proto__, prop, val);
            target.__proto__[prop] = val;
        }
        return true;
    }

    // TODO:
    // Add another catcher functions

}

export default LocalProxy