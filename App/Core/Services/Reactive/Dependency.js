import Component from '../../Component.js';
import { AreaExpanding } from '../../Service.js';

class Dependency {

    static counter = 1;

    //Список зависимых полей и их функции
    dependencies = {};
    //Компонент или TRUE, если глобальный объект, или FALSE, если нет компонента
    component;
    //Список связанных ИД и свойств
    unions = {};

    constructor(component) {
        this.component = component;
    }

    /**
     * Добавляет функцию для свойства
     * @param {string} prop Свойство
     * @param {function} func Функция
     */
    add(prop, func, caller = null) {
        if (!(prop in this.dependencies)) this.dependencies[prop] = {};
        //const insertIndex = this.dependencies[prop].length;
        if (caller) {
            //Добавляем пустые объекты, если они отсутсвуют
            if (!('dependencies' in caller)) caller.dependencies = new Set();
            //Добавляем индекс в объект конструкции, откуда был вызван
            caller.dependencies.add(Dependency.counter);
            //Сохраняем отключаемую функцию
            this.dependencies[prop][Dependency.counter] = { func, enabled: true };
        } else {
            // TODO: надо чтобы сюда не приходили существующие функции
            // TODO: удалить при ненадобности
            for (const i in this.dependencies[prop]) {
                if (func !== this.dependencies[prop][i]) continue;
                console.error('INCLUDES: '+prop, i);
            }
            //Сохраняем функцию
            this.dependencies[prop][Dependency.counter] = func;
        }
        this.unions[Dependency.counter] = prop;
        return Dependency.counter++;
    }

    /**
     * Удаление наблюдателя
     * @param {Number} id ИД наблюдателя
     */
    remove(id) {
        const prop = this.unions[id];
        if (!prop) return;
        delete this.dependencies[prop][id];
        delete this.unions[id];
    }

    /**
     * Управление активностью функции
     * @param {Number} id Индекс массива функции в свойстве
     * @param {boolean} enable Включить или отключить
     */
    setActive(id, enable = true) {
        const prop = this.unions[id];
        if (!prop) return;
        this.dependencies[prop][id].enabled = enable;
    }

    /**
     * Вызывет функции для свойства и рекурсивно для дочерних компонентов
     * @param {string} prop Свойство
     */
    call(prop, ...params) {
        if (this.component instanceof Component) {
            //Если компонент отключен, то ничего не выполняем
            if (!this.component.isActive()) return;
        }
        //Выполняем все функции
        if (prop in this.dependencies) {
            //console.warn('CALL: '+prop, this.component);
            //console.log(params);
            //console.log(this.dependencies[prop]);
            for (const id in this.dependencies[prop]) {
                const func = this.dependencies[prop][id];
                if (func instanceof Function) func(...params);
                else if (func.hasOwnProperty('enabled') && func.enabled) func.func(...params);
                else if (func.hasOwnProperty('method')) {
                    func.method.call(func.context, ...params);
                }
            }
        }
    }

    /**
     * Определение управляющего объекта для данных компонента для манипулирования слушателей прокси
     * @param {object} vars Объект данных
     * @param {Component|true|false} component Компонент, true - глобальный объект данных, false - без компонента
     */
    static define(vars, component = true) {
        const dependency = new this(component);
        //Если компонент, то связываем
        if (component instanceof Component) component.setDependency(dependency);
        AreaExpanding.setHandler(vars, dependency);
    }

}

export default Dependency