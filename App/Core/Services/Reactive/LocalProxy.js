import Directives from './Directives.js';

class LocalProxy {
    
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
        if (typeof prop !== 'symbol' && Directives.$dep) {
            //Добавляем слушатель в данных компонента, в котором вызвали свойство
            //т.е. при первом попадании сюда
            if (!this.isUsedOrigin) {
                this.isUsedOrigin = true;
                if (Directives.$dep instanceof Function) {
                    target.getHandler().add(prop, Directives.$dep);
                } else if (Directives.$dep instanceof Object) {
                    target.getHandler().add(prop, Directives.$dep.func, Directives.$dep.use);
                }
            }
            //Если дошли до объекта, где содержится это свойство, то убираем флаг
            if (target.hasOwnProperty(prop)) {
                this.isUsedOrigin = false;
            }
        }
        return Reflect.get(target, prop, receiver);
    }
    
    static set(target, prop, val, receiver) {
        //Для установки радительского Proxy объекта
        if (prop == '__proto__') {
            //Когда собирается прокси дерево объектов
            target.__proto__ = val;
            return true;
        }
        //Если изменилось настоящее свойство объекта, то проверку проходит
        if (target.hasOwnProperty(prop)) {
            const result = Reflect.set(target, prop, val, receiver);
            //Выполняем все функции зависимости (слушатели прокси)
            if (result) target.getHandler().call(prop);
            return result;
        } else { //Иначе изменяем в родительском объекте, пока не дойдем до свойства
            target.__proto__[prop] = val;
        }
        return true;
    }

    // TODO:
    // Add another catcher functions

}

export default LocalProxy