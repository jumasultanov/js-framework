import Component from '../../Component.js';
import { AreaExpanding } from '../../Service.js';

class Dependency {

    //Счетчик для ИД наблюдателей
    static counter = 1;
    //Максимальное кол-во вызовов для одного наблюдателя за один пул изменении
    static maxLoopCall = 50;
    //Последний компонент вызова для предотвращения рекурсии updated
    static prevCallComp;
    //Счетчик цикла обновления
    static callCounter = 0;
    static callComponent = new Set();
    static callWatchers = new Set();

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
     * @param {object} watcher Наблюдатель
     */
    add(prop, watcher, caller = null) {
        // TODO: Проверить насколько быстрее будет работать код, 
        //          если объект для перебора в методе "call" хранить в коллекции Set c id наблюдателей,
        //          а объекты с наблюдателями в другом объекте и доставать их оттуда по ИД
        if (!(prop in this.dependencies)) this.dependencies[prop] = {};
        //Добавляем счетчик вызовов
        watcher.countCall = 0;
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
     * Добавление наблюдателей для объекта или массива, чтобы следить за их изменением
     * @param  {...function} callbacks 
     */
    addObjectWatchers(...callbacks) {
        this.add('$create', { method: callbacks[0] });
        this.add('$delete', { method: callbacks[1] });
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
     * Удаление наблюдателей по свойству
     * @param {string} prop 
     * @returns 
     */
    removeProp(prop) {
        if (!(prop in this.dependencies)) return;
        const ids = Object.keys(this.dependencies[prop]);
        for (const id of ids) delete this.unions[id];
        delete this.dependencies[prop];
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
        if (typeof this.component != 'boolean') {
            //Если компонент отключен, то ничего не выполняем
            if (!this.component.isActive()) return;
        }
        //Выполняем все функции
        if (prop in this.dependencies) {
            //console.warn('CALL: '+prop, this.component?.path?.join(' -> '));
            //console.log(params);
            //console.log(this.dependencies[prop]);
            // TODO: Проверять кол-во выполнении, чтобы не попадать в бесконечный цикл
            //  
            Dependency.startCall();
            for (const id in this.dependencies[prop]) {
                const watcher = this.dependencies[prop][id];
                //Проверка на активность
                if (watcher.hasOwnProperty('enabled') && !watcher.enabled) continue;
                //Изменяем счетчик и храним наблюдателя
                watcher.countCall++;
                if (watcher.countCall === 1) Dependency.callWatchers.add(watcher);
                //Проверка на максимальное число выполнении за один пул
                if (watcher.countCall > Dependency.maxLoopCall) {
                    Dependency.clearCall();
                    throw new Error(`Maximum call watcher registered: for prop -> ${prop}`);
                }
                //Выполняем функцию
                if (watcher.context) watcher.method.call(watcher.context, ...params);
                else watcher.method(...params);
            }
            Dependency.endCall();
        }
    }

    /**
     * При событии начала изменении в прокси SET, сохранение и вызов хуков
     * @param {Component} comp 
     */
    static startChange(comp) {
        //Только для компонентов
        if (typeof comp == 'boolean') return;
        const hookUp = comp.origin.hasOwnProperty('updated');
        const hookBup = comp.origin.hasOwnProperty('beforeUpdate');
        if (!hookUp && !hookBup) return;
        //Нужно для понимания добавлиось ли в коллекцию
        const size = this.callComponent.size;
        //Сохраняем в коллекцию
        this.callComponent.add(comp);
        //Если есть хук beforeUpdate, то вызываем ее один раз
        if (hookBup && this.callComponent.size > size) {
            comp.vars.beforeUpdate();
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
        if (!this.callCounter) this.endChange();
    }

    /**
     * При событии окончания изменении в прокси SET, вызов хуков и очистка
     */
    static endChange() {
        for (const comp of this.callComponent) {
            if (this.prevCallComp === comp) continue;
            this.prevCallComp = comp;
            if (comp.origin.hasOwnProperty('updated')) {
                comp.vars.updated();
            }
        }
        this.clearCall();
    }

    /**
     * Очистка списков
     */
    static clearCall() {
        this.prevCallComp = null;
        this.callCounter = 0;
        this.callComponent.clear();
        //Обновляем счетчик
        for (const watcher of this.callWatchers) watcher.countCall = 0;
        this.callWatchers.clear();
    }

    /**
     * Определение управляющего объекта для данных компонента для манипулирования слушателей прокси
     * @param {object} vars Объект данных
     * @param {Component|true|false} component Компонент, true - глобальный объект данных, false - без компонента
     */
    static define(vars, component = true) {
        const dependency = new this(component);
        //Если компонент, то связываем
        if (typeof component != 'boolean') component.setDependency(dependency);
        AreaExpanding.setHandler(vars, dependency);
    }

}

export default Dependency