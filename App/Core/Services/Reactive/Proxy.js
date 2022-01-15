import Directives from './Directives.js';

class _Proxy {

    static deps = {};
    
    static on(obj) {
        /**
         * TODO:
         *      Что то сделать для вложенных объектов и объектов моделей
         */
        return new Proxy(obj, this);
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
        console.log(`SET ${prop} = ${val}`, target);
        let result = Reflect.set(target, prop, val, receiver);
        if (!prop.startsWith('$') && this.deps[prop]) {
            for (const dep of this.deps[prop]) dep(val);
        }
        return result;
    }

    // TODO:
    // Add another catcher functions

}

export default _Proxy