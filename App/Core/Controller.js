import { Helper } from './Service.js';

class Controller {

    //Игнорируемые методы
    static mergeIgnored = new Set(['constructor']);

    constructor() {
        
    }

    /**
     * Возвращает экземпляр объекта
     * @param {Component} Компонент, для которого выполняется контроллер
     * @returns {Controller}
     */
    static getInstance(component) {
        return new this(component);
    }

    /**
     * Совмещение контроллера с объектом данных блока
     * @param {object} target 
     */
    mergeTo(target) {
        //Собираем свойства объекта
        for (let prop of Object.getOwnPropertyNames(this)) {
            //Пропускаем, если есть в целевом объекте
            if (target.hasOwnProperty(prop)) continue;
            Object.defineProperty(target, prop, Helper.getDescriptor(this[prop]));
        }
        for (let method of Object.getOwnPropertyNames(this.__proto__)) {
            //Игнорируем зарезервированные методы
            if (Controller.mergeIgnored.has(method)) continue;
            //Пропускаем, если есть в целевом объекте
            if (target.hasOwnProperty(method)) continue;
            Object.defineProperty(target, method, Helper.getDescriptor(this[method]));
        }
    }

}

export default Controller