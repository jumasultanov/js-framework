import Component from '../../Component.js';
import { Helper } from '../../Service.js';

class Dependency {

    //Список зависимых полей и их функции
    dependencies = {};
    //Компонент или TRUE, если глобальный объект, или FALSE, если нет компонента
    component;

    constructor(component) {
        this.component = component;
    }

    /**
     * Добавляет функцию для свойства
     * @param {string} prop Свойство
     * @param {function} func Функция
     */
    add(prop, func, caller = null) {
        if (!(prop in this.dependencies)) this.dependencies[prop] = [];
        const insertIndex = this.dependencies[prop].length;
        if (caller) {
            //Добавляем пустые объекты, если они отсутсвуют
            if (!('dependencies' in caller)) caller.dependencies = {};
            if (!(prop in caller.dependencies)) caller.dependencies[prop] = new Set();
            //Добавляем индекс в объект конструкции, откуда был вызван
            caller.dependencies[prop].add(insertIndex);
            //Сохраняем отключаемую функцию
            this.dependencies[prop].push({ func, enabled: true });
        } else {
            // TODO: надо чтобы сюда не приходили существующие функции
            if (this.dependencies[prop].includes(func)) {
                console.error('INCLUDES: '+prop, this.dependencies[prop].includes(func));
            }
            //Сохраняем функцию
            this.dependencies[prop].push(func);
        }
        return insertIndex;
    }

    /**
     * Управление активностью функции
     * @param {string} prop Свойство
     * @param {number} index Индекс массива функции в свойстве
     * @param {boolean} enable Включить или отключить
     */
    setActive(prop, index, enable = true) {
        if (!(prop in this.dependencies)) return;
        if (!(this.dependencies[prop][index] instanceof Object)) return;
        this.dependencies[prop][index].enabled = enable;
    }

    /**
     * Вызывет функции для свойства и рекурсивно для дочерних компонентов
     * @param {string} prop Свойство
     */
    call(prop, params = null, recursive = false) {
        //console.log(prop, this);
        //Получаем дочерние компоненты
        let children;
        if (this.component instanceof Component) {
            //Если компонент отключен, то ничего не выполняем
            if (!this.component.isActive()) return;
            children = this.component.getChildren();
        } else if (this.component === true) children = Component.items;
        //Выполняем все функции
        if (prop in this.dependencies) {
            //console.log('CALL: '+prop,this.dependencies[prop]);
            for (const func of this.dependencies[prop]) {
                if (func instanceof Function) func(params);
                else if (func.enabled) func.func(params);
            }
        }
        /*console.log(children);
        //Выполняем в дочерних компонентах
        if (recursive && children) {
            for (const name in children) {
                children[name].getDependency().call(prop, params, recursive);
            }
        }*/
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
        // Указываем невидимый метод для объекта данных
        const descriptor = Helper.getDescriptor(() => dependency, false, false, false);
        Object.defineProperty(vars, 'getHandler', descriptor);
    }

}

export default Dependency