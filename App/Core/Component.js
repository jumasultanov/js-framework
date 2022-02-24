import BaseComponent from './BaseComponent.js';
import Area from "./Area.js";
import { Log, Parser, Block, Dependency } from './Service.js';
import { AppConfig } from '../config.js';

class Component extends BaseComponent {

    //Дочерние компоненты - название блока(ключ), Component(значение)
    children = {};
    //Флаг готовности загрузки скриптов контроллеров
    loadedControllers = false;
    //Список имен контроллеров из парсера
    controllerNames = [];
    //Node элемент блока из парсера
    element;
    //Название компонента из парсера
    name;
    //Путь компонента
    path = [];
    //Загруженные контроллеры
    controllers = [];
    //Объект DOM, в котором есть список конструкции для VNode
    vdom;
    //Данные(переменные) блока
    vars;
    origin;
    //Флаг активности
    enabled = false;
    //Объект зависимых полей и их функции для геттеров и сеттеров прокси
    dependency;
    //Наблюдатели
    watchers = {};
    //Использованные ИД и их зависимости
    usedDeps = {};

    constructor(data) {
        super();
        Object.assign(this, data);
    }

    /**
     * Начало работы компонента
     * @returns {this}
     */
    build() {
        //Парсим блок компонента
        this.vdom = new Parser(this.element, this)
            .build() //Строим списки VNode
            .getVDOM(); //Получаем списки
        return this;
    }

    /**
     * Конец работы компонента
     */
    unbuild() {
        let parent = Component.find(this.path.slice(0, -1));
        Component.die(this);
        if (parent) {
            delete parent.children[this.name];
        } else if (this.name in Component.items) {
            delete Component.items[this.name];
        }
    }

    /**
     * Проверка на доступность
     * @returns {boolean}
     */
    isDestroyed() {
        return !this.vdom;
    }

    /**
     * Определяем область данных для компонента
     * @param {object|null} defaultVars Доп.данные
     * @returns {this}
     */
    defineArea(defaultVars = null) {
        let { proxy, vars } = Area.find(this.path, defaultVars);
        this.vars = proxy;
        this.origin = vars;
        //Сохраняем компонент в объекте данных
        if (!vars.hasOwnProperty('$component')) {
            vars.$create('$component', this, false);
        }
        //Переносим данные с контроллера
        this.controllers.forEach(controller => controller.mergeTo(vars, this));
        //Для объекта данных делаем предустановки для зависимостей прокси
        Dependency.define(vars, this);
        return this;
    }

    /**
     * Возвращает объект Dependency
     * @returns {Dependency}
     */
    getDependency() {
        return this.dependency;
    }

    /**
     * Устанавливает для компонента объект Dependency
     * @param {Dependency} dependency 
     */
    setDependency(dependency) {
        this.dependency = dependency;
    }

    /**
     * Добавление связи с зависимостью выше по структуре
     * @param {Dependency} dependency Объект зависимости
     * @param {Number} id ИД наблюдателя
     */
    addUsedDeps(dependency, id) {
        this.usedDeps[id] = dependency;
    }

    /**
     * Удаление наблюдателей из зависимотей выше по структуре
     */
    clearUsedDeps() {
        for (const id in this.usedDeps) {
            this.usedDeps[id].remove(id);
        }
        this.usedDeps = {};
    }

    /**
     * Сохранение наблюдателя за свойством во временный список
     * @param {string} methodName Имя свойства
     * @param {function} method Наблюдатель
     */
    saveWatcher(methodName, method) {
        this.watchers[methodName] = {
            context: this.vars,
            method,
            getComponent: () => this
        };
    }

    /**
     * Вставка наблюдателей в объект зависимости
     */
    insertWatchers() {
        for (let methodName in this.watchers) {
            const dependency = this.origin.getOrigin(methodName).getHandler();
            const inserted = dependency.add(methodName, this.watchers[methodName]);
            this.addUsedDeps(dependency, inserted);
        }
        this.watchers = {};
    }

    /**
     * Возвращает объект данных
     * @returns {Proxy|null}
     */
    getVars() {
        return this.vars;
    }

    /**
     * Возвращает новый компонент относительно текущей
     * @param {string} name Новое название
     * @param {boolean} ready Предстартовые установки (парсинг элемента и определение данных
     * @param {object|null} defaultVars Доп. данные
     * @returns {Component}
     */
    clone(name, ready = true, defaultVars = null) {
        const cloneElement = this.element.cloneNode(true);
        const path = [...this.path];
        path.pop();
        return Component.createEmpty(cloneElement, name, path, ready, defaultVars);
    }

    /**
     * Добавление дочернего компонента
     * @param {Component} component 
     */
    appendChild(component) {
        this.children[component.name] = component;
        component.updatePath(this.path);
    }

    /**
     * Возвращает дочерние компоненты
     * @returns {object}
     */
    getChildren() {
        return this.children;
    }

    /**
     * Заменяет дочерние элементы с выводом в DOM
     * @param {Component[]} components Компоненты, которые нужно вставить
     * @param {Node} savePoint Элемент, перед которым вставится
     * @param {Set} inserted Список уже вставленных компонентов
     */
    replaceChildren(components, savePoint, inserted) {
        //Удаляем то, что было вставлено
        for (const component of inserted) this.removeChild(component, inserted);
        //Собираем элементы и добавляем дочерние компоненты
        for (const component of components) this.insertChild(component, savePoint, inserted);
    }

    /**
     * Добавляет дочерний компонент с выводом в DOM
     * @param {Component} component Вставляемый компонент
     * @param {Node} savePoint Элемент, перед которым вставится
     * @param {Set} inserted Список уже вставленных компонентов 
     */
    insertChild(component, savePoint, inserted) {
        this.children[component.name] = component;
        inserted.add(component);
        //Добавляем в DOM
        Block.insert(component.element, savePoint);
        //Запускаем
        Component.enable(component);
    }

    /**
     * Меняет местами два дочерних компонента
     * @param {Component} component1 
     * @param {Component} component2 
     */
    swapChild(component1, component2) {
        //Меняем имена
        const newName = component2.name;
        const oldName = component1.name;
        component1.updateName(newName);
        component2.updateName(oldName);
        //Меняем в списке дочерних компонентов
        this.children[newName] = component1;
        this.children[oldName] = component2;
        //Меняем в DOM
        Block.swap(component1.element, component2.element);
        //Меняем в списке данных
        Area.move(component1.path, component2.path);
    }

    /**
     * Удаляет дочерний компонент с удалением из DOM
     * @param {Component} component Удаляемый компонент
     * @param {Set|null} inserted Список уже вставленных компонентов
     * @param {boolean} die Удалять ли данные
     */
    removeChild(component, inserted = null, die = false) {
        delete this.children[component.name];
        if (inserted) inserted.delete(component);
        //Удаляем элементы из DOM
        Block.remove(component.element);
        //Удаляем данные, если нужно, иначе выключаем
        if (die) Component.die(component);
        else Component.disable(component);
    }

    /**
     * Собирает все дочерние компоненты в одном месте, сортируя по именам
     * @param {string[]} names Список названии
     * @param {Node} savePoint Элемент, перед которым будут вставляться
     */
    collectChildrenBlocks(names, savePoint) {
        //Перебираем с конца
        for (let i = names.length - 1; i > -1; i--) {
            const element = this.children[names[i]].element;
            //Если перед элементом уже стоит этот блок, то вставку не делаем
            if (element !== savePoint.previousSibling) Block.insert(element, savePoint);
            //Сдвигаемся
            savePoint = savePoint.previousSibling;
        }
    }

    /**
     * Возвращает путь до компонента
     * @returns {string[]}
     */
    getPath() {
        return this.path;
    }

    /**
     * Обновляем путь компонента
     * @param {string[]} parentPath Родительский путь
     * @return {this}
     */
    updatePath(parentPath = []) {
        this.path = [...parentPath];
        this.path.push(this.name);
        return this;
    }

    /**
     * Определить новое название
     * @param {string} name Название
     * @returns {this}
     */
    updateName(name) {
        this.name = name;
        this.path[this.path.length-1] = name;
        return this;
    }

    /**
     * Загрузка контроллеров
     * @param {Function} Функция вызовется после загрузки всех контроллеров
     * @return {this}
     */
    loadControllers() {
        Component.count++;
        if (this.controllerNames.length) {
            this.controllerNames.forEach(controllerName => this.loadController(controllerName));
        } else {
            this.completeLoadControllers();
        }
        return this;
    }

    /**
     * Загрузка контроллера
     * @param {string} controllerName Название контроллера
     */
    loadController(controllerName) {
        let path = `${AppConfig.controllerPath}/${controllerName}.js`;
        import(path)
            .then(module => {
                this.addController(module.default.getInstance(this));
            })
            .catch(err => {
                Log.send(
                    [`Cannot load: ${controllerName}`, `URI: ${path}`, err.message],
                    Log.TYPE_ERROR,
                    'Import controller'
                );
            });
    }

    /**
     * Добавление контроллера
     * @param {Controller} controller 
     */
    addController(controller) {
        this.controllers.push(controller);
        if (this.controllerNames.length == this.controllers.length) this.completeLoadControllers();
    }

    /**
     * После загрузки всех контроллеров
     */
    completeLoadControllers() {
        this.loadedController = true;
        //Определяем область данных
        this.defineArea();
        //Выполняем родительский метод завершения загрузок
        if (Component.completeLoadControllers instanceof Function) {
            Component.completeLoadControllers();
        }
    }

    /**
     * Активность компонента
     * @returns {boolean}
     */
    isActive() {
        return this.enabled;
    }

    /**
     * Активация компонента
     */
    enable() {
        if (this.enabled) return;
        this.enabled = true;
        if (!this.vdom.isActive()) {
            this.insertWatchers();
            this.vdom.enableReactive();
            if (this.vars.hasOwnProperty('mounted')) this.vars.mounted();
        }
    }
    
    /**
     * Деактивация компонента
     */
    disable() {
        if (!this.enabled) return;
        this.enabled = false;
    }

    /**
     * Уничтожение компонента,
     *      вызывать из BaseComponent,
     *      т.к. тут одиночное удаление без прохода по дочерним компонентам
     */
    die() {
        //Вызываем событие перед уничтожением
        if (this.vars.hasOwnProperty('beforeDestroy')) this.vars.beforeDestroy();
        this.enabled = false;
        //Удаляем область данных
        Area.delete(this.path);
        //Удаляем наблюдателей из зависимостей выше в структуре данных
        this.clearUsedDeps();
        //Удаляем реактивность
        this.vdom.disableReactive();
        //Удаляем из DOM
        Block.remove(this.element);
        //Вызываем событие после уничтожения
        if (this.vars.hasOwnProperty('destroyed')) this.vars.destroyed();
        //Обнуляем ссылки на объекты
        this.dependency = null;
        this.vdom = null;
        this.element = null;
        this.vars = null;
        this.origin = null;
    }

}

export default Component