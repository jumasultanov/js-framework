import Directive from '../../Directive.js';
import { Executor, AreaProxy, Dependency } from '../../Service.js';

class LocalProxy {

    /**
     * Чтение свойства объекта
     * @param {object} target Объект
     * @param {string} prop Название свойства объекта
     * @param {object} receiver Целевой объект
     * @returns {any}
     */
    static get(target, prop, receiver) {
        if (typeof prop !== 'symbol' && prop !== 'hasOwnProperty') {
            if (Executor.$dep) {
                if (target.hasOwnProperty(prop) || Executor.$inners) {
                    Executor.$target = target;
                    Executor.$prop = prop;
                    Executor.$inners = true;
                }
            } else {
                //Выполняем частные методы директив
                const result = Directive.on('onProxyGet', target, prop, receiver);
                if (result !== undefined) return result;
            }
        }
        return Reflect.get(target, prop, receiver);
    }
    
    /**
     * Изменение свойства объекта
     * @param {object} target Объект
     * @param {string} prop Название свойства объекта
     * @param {any} val Значение свойства объекта
     * @param {object} receiver Целевой объект
     * @returns {boolean}
     */
    static set(target, prop, val, receiver) {
        //Для установки радительского Proxy объекта
        if (prop == '__proto__') {
            //Когда собирается прокси дерево объектов
            target.__proto__ = val;
            return true;
        }
        if (target.hasOwnProperty(prop)) {
            //Реализация хуков для компонентов
            Dependency.startChange(target.getHandler().component);
        }
        //Выполняем частные методы директив
        const result = Directive.on('onProxySet', target, prop, val, receiver);
        if (result !== undefined) return result;
        //Если изменилось настоящее свойство объекта, то проверку проходит
        if (target.hasOwnProperty(prop)) {
            const oldValue = target[prop];
            const result = Reflect.set(target, prop, val, receiver);
            //Выполняем все функции зависимости (слушатели прокси)
            if (result) {
                //Перед этим проксируем, если объект
                AreaProxy.one(target, prop);
                target.getHandler().call(prop, target[prop], oldValue);
                //Вызываем наблюдателя за обновлением элемента
                target.$update('$update', { prop, val: oldValue });
            }
            return result;
        } else { //Иначе изменяем в родительском объекте, пока не дойдем до свойства
            if (prop in target) {
                target.__proto__[prop] = val;
            } else {
                target.$create(prop, val);
                //Вызываем наблюдателя за добавлением элементов
                target.$update('$create', { prop });
            }
        }
        return true;
    }

    /**
     * Удаление свойства объекта
     * @param {object} target Объект
     * @param {string} prop Название свойства объекта
     * @param {object} receiver Целевой объект
     * @returns {boolean}
     */
    static deleteProperty(target, prop, receiver) {
        //Выполняем частные методы директив
        let result = Directive.on('onProxyDeleteProperty', target, prop, receiver);
        if (result === undefined) {
            const removedVal = target[prop];
            result = Reflect.deleteProperty(target, prop, receiver);
            //Вызываем наблюдателя за удалением элементов
            target.$update('$delete', { prop, val: removedVal });
        }
        return result;
    }

}

export default LocalProxy