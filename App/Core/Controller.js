class Controller {

    //Игнорируемые методы
    static mergeIgnored = new Set(['constructor']);
    //
    static watcherPrefix = 'watch';

    constructor() {
        
    }

    /**
     * Возвращает экземпляр объекта
     * @param {Component} component Компонент, для которого выполняется контроллер
     * @returns {Controller}
     */
    static getInstance(component) {
        return new this(component);
    }

    /**
     * Совмещение контроллера с объектом данных блока
     * @param {object} target Объект, куда будет сливаться
     * @param {Component} component Компонент, для которого выполняется контроллер
     */
    mergeTo(target, component) {
        //Собираем свойства объекта
        for (let prop of Object.getOwnPropertyNames(this)) {
            //Пропускаем, если есть в целевом объекте
            if (target.hasOwnProperty(prop)) continue;
            target.$create(prop, this[prop]);
        }
        for (let method of Object.getOwnPropertyNames(this.__proto__)) {
            //Игнорируем зарезервированные методы
            if (Controller.mergeIgnored.has(method)) continue;
            //Пропускаем, если есть в целевом объекте
            if (target.hasOwnProperty(method)) continue;
            //Если метод - наблюдатель за свойством, распознается префиксом
            if (method.startsWith(Controller.watcherPrefix)) {
                if (this.setWatcher(component, target, method)) continue;
            }
            target.$create(method, this[method]);
        }
        //Вызываем событие контроллера после слияния
        if (target.hasOwnProperty('created')) target.created();
    }

    /**
     * Добавляем наблюдателя в зависимости
     * @param {object} target 
     * @param {string} methodName 
     * @returns {boolean}
     */
    setWatcher(component, target, methodName) {
        let prop = methodName.substring(Controller.watcherPrefix.length);
        prop = prop[0].toLowerCase() + prop.slice(1);
        if (prop in target) {
            component.saveWatcher(prop, this[methodName]);
            return true;
        }
        return false;
    }

}

export default Controller