import Directives from './Directives.js';
import { Helper, InternalProxy } from '../../Service.js';

class LocalProxy {

    static prevPosition = null;
    
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
        } else {
            if (target.isArray) {
                if (!isNaN(Number(prop))) {
                    this.prevPosition = prop;
                } else if (prop == 'sort') {
                    this.arraySort = [];
                    this.arrayLastIndex = target.length - 1;
                } else if (prop == 'reverse') {
                    this.arrayReverse = [];
                    this.arrayLength = (target.length % 2 == 0 ? target.length : target.length - 1 );
                }
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
                    Reflect.set(target, prop, val, receiver);
                    console.warn('PUSH', prop, val);
                    InternalProxy.one(target, prop);
                    InternalProxy.arrayChange(target, prop, InternalProxy.ARRAY_PUSH);
                } else {
                    // TODO: 
                    //      Отработать перебор объектов, чисел и строк
                    //      Распилить на классы директивы 
                    //      и через обсервер обращаться к каждой директиве, если он подписан на события GET, SET и т.д.
                    if (this.arraySort) {
                        if (target[prop] !== val) this.arraySort.push(prop);
                        Reflect.set(target, prop, val, receiver);
                        if (prop == this.arrayLastIndex) {
                            InternalProxy.arrayChange(target, this.arraySort, InternalProxy.ARRAY_SORT);
                            this.arraySort = null;
                        }
                    } else if (this.arrayReverse) {
                        this.arrayReverse.push(prop);
                        Reflect.set(target, prop, val, receiver);
                        if (this.arrayReverse.length == this.arrayLength) {
                            InternalProxy.arrayChange(target, this.arrayReverse, InternalProxy.ARRAY_REVERSE);
                            this.arrayReverse = null;
                        }
                    } else {
                        // Отсюда начинаются перемещения индексов
                        //console.group('CHANGE INDEX');
                        console.warn('Move', this.prevPosition + ' -> ' + prop, val);
                        /*console.log(prop, val);
                        console.log(target[prop]);
                        console.groupEnd();*/
                        if (this.prevPosition === null || target[this.prevPosition] !== val) {
                            console.warn('PASTE NEW', prop, val);
                            Reflect.set(target, prop, val, receiver);
                            InternalProxy.one(target, prop);
                            InternalProxy.arrayChange(target, prop, InternalProxy.ARRAY_PUSH);
                        } else {
                            console.warn('MOVE', prop, val);
                            InternalProxy.arrayChange(target, { value: prop, replace: this.prevPosition }, InternalProxy.ARRAY_MOVE);
                            Reflect.set(target, prop, val, receiver);
                        }
                    }
                }
                this.prevPosition = null;
                return true;
            }
        }
        //Если изменилось настоящее свойство объекта, то проверку проходит
        if (target.hasOwnProperty(prop)) {
            /*console.warn(prop);
            console.log(target);
            console.log(val);*/
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
        if (target.isArray) {
            //Удаление из массива
            if (!isNaN(Number(prop))) {
                console.warn('DELETE', prop);
                console.log(target);
                InternalProxy.arrayChange(target, prop, InternalProxy.ARRAY_DELETE);
                return Reflect.deleteProperty(target, prop, receiver);
            }
        }
        return Reflect.deleteProperty(target, prop, receiver);
    }

    // TODO:
    // Add another catcher functions

}

export default LocalProxy