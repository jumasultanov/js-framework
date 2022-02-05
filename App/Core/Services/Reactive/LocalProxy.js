import Directives from './Directives.js';
import { InternalProxy } from '../../Service.js';

class LocalProxy {

    static arrayIndex = [];
    
    /**
     * Возвращает прокси для объекта
     * @param {object} vars Проксируемый объект
     * @returns {object}
     */
    static on(vars) {
        //Проксируем основной объект и возвращаем оба варианта
        const proxy = new Proxy(vars, this);
        //Проксируем вложенные объекты
        InternalProxy.on(vars);
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
        if (typeof prop !== 'symbol' && Directives.$dep && prop !== 'hasOwnProperty') {
            if (target.hasOwnProperty(prop) || Directives.$inners) {
                Directives.$target = target;
                Directives.$prop = prop;
                Directives.$inners = true;
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
        if (target.isArray) {
            //Добавление в массив
            if (!isNaN(Number(prop))) {
                if (!(prop in target)) {
                    console.warn(target);
                    console.warn('PUSH', prop, val);
                    const result = Reflect.set(target, prop, val, receiver);
                    InternalProxy.one(target, prop);
                    InternalProxy.arrayChange(target, prop, InternalProxy.ARRAY_PUSH);
                    return result;
                } else {
                    this.arrayIndex.push(prop);
                    // Отсюда начинаются перемещения индексов
                    console.group('CHANGE INDEX');
                    console.log(prop, val);
                    console.log(target[prop]);
                    console.groupEnd();
                    // TODO:
                    //      Надо отработать все методы массива
                    //      Удаления, доавбления и перемещения индексов сделать раздельно
                }
            }
        }
        //Если изменилось настоящее свойство объекта, то проверку проходит
        if (target.hasOwnProperty(prop)) {
            console.warn(prop);
            console.log(target);
            console.log(val);
            const result = Reflect.set(target, prop, val, receiver);
            //Выполняем все функции зависимости (слушатели прокси)
            if (result) target.getHandler().call(prop);
            return result;
        } else { //Иначе изменяем в родительском объекте, пока не дойдем до свойства
            target.__proto__[prop] = val;
        }
        return true;
    }

    static deleteProperty(target, prop, receiver) {
        if (target.isArray) {
            //Добавление в массив
            if (!isNaN(Number(prop))) {
                let currentIndex = prop;
                if (this.arrayIndex.length) currentIndex = this.arrayIndex[0];
                this.arrayIndex = [];
                console.warn('DELETE', prop);
                console.log(target);
                InternalProxy.arrayChange(target, currentIndex, InternalProxy.ARRAY_DELETE);
                return Reflect.deleteProperty(target, prop, receiver);
            }
        }
        return Reflect.deleteProperty(target, prop, receiver);
    }

    // TODO:
    // Add another catcher functions

}

export default LocalProxy