import Directive from '../../Directive.js';
import { Directives, InternalProxy } from '../../Service.js';

class LocalProxy {
    
    /**
     * Возвращает прокси для объекта
     * @param {object} vars Проксируемый объект
     * @returns {object}
     */
    static on(vars) {
        //Проксируем основной объект и возвращаем оба варианта
        const proxy = new Proxy(vars, this);
        //Добавляем скрытый метод добавления свойства
        InternalProxy.setCreate(vars);
        //Проксируем вложенные объекты
        InternalProxy.on(vars);
        return { proxy, vars };
    }

    static get(target, prop, receiver) {
        if (typeof prop !== 'symbol' && Directives.$dep && prop !== 'hasOwnProperty') {
            if (target.hasOwnProperty(prop) || Directives.$inners) {
                Directives.$target = target;
                Directives.$prop = prop;
                Directives.$inners = true;
            }
        } else {
            //Выполняем частные методы директив
            const result = Directive.on('onProxyGet', target, prop, receiver);
            if (result !== undefined) return result;
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
        //Выполняем частные методы директив
        const result = Directive.on('onProxySet', target, prop, val, receiver);
        if (result !== undefined) return result;
        //Если изменилось настоящее свойство объекта, то проверку проходит
        if (target.hasOwnProperty(prop)) {
            const result = Reflect.set(target, prop, val, receiver);
            //Выполняем все функции зависимости (слушатели прокси)
            if (result) target.getHandler().call(prop);
            return result;
        } else { //Иначе изменяем в родительском объекте, пока не дойдем до свойства
            if (prop in target) {
                target.__proto__[prop] = val;
            } else {
                target.$create(prop, val);
            }
        }
        return true;
    }

    static deleteProperty(target, prop, receiver) {
        //Выполняем частные методы директив
        const result = Directive.on('onProxyDeleteProperty', target, prop, receiver);
        if (result !== undefined) return result;
        return Reflect.deleteProperty(target, prop, receiver);
    }

    // TODO:
    // Add another catcher functions

}

export default LocalProxy