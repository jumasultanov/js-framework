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
        if (caller) {
            //Добавляем пустые объекты, если они отсутсвуют
            if (!('dependencies' in caller)) caller.dependencies = {};
            if (!(prop in caller.dependencies)) caller.dependencies[prop] = new Set();
            //Добавляем индекс в объект конструкции, откуда был вызван
            caller.dependencies[prop].add(this.dependencies[prop].length);
            //Сохраняем отключаемую функцию
            this.dependencies[prop].push({ func, enabled: true });
        } else {
            //Сохраняем функцию
            this.dependencies[prop].push(func);
        }
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
    call(prop) {
        //Получаем дочерние компоненты
        let children;
        if (this.component instanceof Component) {
            //Если компонент отключен, то ничего не выполняем
            if (!this.component.isActive()) return;
            children = this.component.getChildren();
        } else if (this.component === true) children = Component.items;
        //Выполняем все функции
        if (prop in this.dependencies) {
            for (const func of this.dependencies[prop]) {
                if (func instanceof Function) func();
                else if (func.enabled) func.func();
            }
        }
        //Выполняем в дочерних компонентах
        if (children) {
            for (const name in children) children[name].getDependency().call(prop);
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
        // Указываем невидимый метод для объекта данных
        const descriptor = Helper.getDescriptor(() => dependency, false, false, false);
        Object.defineProperty(vars, 'getHandler', descriptor);
    }

}

export default Dependency