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
    //Счетчик цикла обновления
    static callCounter = 0;
    static callComponent = new Set();

    constructor(component) {
        this.component = component;
    }

    /**
     * Добавляет функцию для свойства
     * @param {string} prop Свойство
     * @param {object} watcher Наблюдатель
     */
    add(prop, watcher, caller = null) {
        // TODO: Проверить насколько быстрее будет работать код, 
        //          если объект для перебора в методе "call" хранить в коллекции Set c id наблюдателей,
        //          а объекты с наблюдателями в другом объекте и доставать их оттуда по ИД
        if (!(prop in this.dependencies)) this.dependencies[prop] = {};
        //const insertIndex = this.dependencies[prop].length;
        if (caller) {
            //Добавляем пустые объекты, если они отсутсвуют
            if (!('dependencies' in caller)) caller.dependencies = new Set();
            //Добавляем индекс в объект конструкции, откуда был вызван
            caller.dependencies.add(Dependency.counter);
            //Сохраняем отключаемую функцию
            this.dependencies[prop][Dependency.counter] = watcher;
        } else {
            // TODO: надо чтобы сюда не приходили существующие функции
            // TODO: удалить при ненадобности
            for (const i in this.dependencies[prop]) {
                if (watcher !== this.dependencies[prop][i]) continue;
                console.error('INCLUDES: '+prop, i);
            }
            //Сохраняем функцию
            this.dependencies[prop][Dependency.counter] = watcher;
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
            //console.warn('CALL: '+prop, this.component?.path?.join(' -> '));
            //console.log(params);
            //console.log(this.dependencies[prop]);
            // TODO: Проверять кол-во выполнении, чтобы не попадать в бесконечный цикл
            Dependency.startCall();
            for (const id in this.dependencies[prop]) {
                const watcher = this.dependencies[prop][id];
                //Получаем ответственный компонент
                const comp = watcher.getComponent();
                //Добавляем компонент для хука обновления
                if (comp.origin.hasOwnProperty('updated')) {
                    Dependency.callComponent.add(comp);
                }
                //Выполняем функцию
                if (watcher.hasOwnProperty('enabled') && !watcher.enabled) continue;
                if (watcher.context) watcher.method.call(watcher.context, ...params);
                else watcher.method(...params);
            }
            Dependency.endCall();
        }
    }

    /**
     * Увеличиваем счетчик перед выполнением наблюдателя
     */
    static startCall() {
        this.callCounter++;
    }
    
    /**
     * Убавляем счетчик после выполнения наблюдателя
     */
    static endCall() {
        this.callCounter--;
        //Если все выполнилось то обнуляем список ответственных компонентов
        if (!this.callCounter) this.clearCall();
    }

    /**
     * Хук обновления и очистка списка
     */
    static clearCall() {
        for (const comp of this.callComponent) comp.vars.updated();
        this.callComponent.clear();
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