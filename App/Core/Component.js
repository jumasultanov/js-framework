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
    //Флаг активности
    enabled = false;
    //Объект зависимых полей и их функции для геттеров и сеттеров прокси
    dependency;

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
     * Определяем область данных для компонента
     * @param {object|null} defaultVars Доп.данные
     * @returns {this}
     */
    defineArea(defaultVars = null) {
        let { proxy, vars } = Area.find(this.path, defaultVars);
        this.vars = proxy;
        this.controllers.forEach(controller => controller.mergeTo(vars));
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

    swapChild(component1, component2) {
        const newName = component2.name;
        const oldName = component1.name;
        component1.updateName(newName);
        component2.updateName(oldName);
        this.children[newName] = component1;
        this.children[oldName] = component2;
        Block.swap(component1.element, component2.element);
        Area.move(component1.path, component2.path);
    }

    /**
     * Удаляет дочерний компонент с удалением из DOM
     * @param {Component} component Удаляемый компонент
     * @param {Set|null} inserted Список уже вставленных компонентов
     */
    removeChild(component, inserted = null, withData = false) {
        delete this.children[component.name];
        if (inserted) inserted.delete(component);
        //Удаляем элементы из DOM
        Block.remove(component.element);
        //Выключаем
        Component.disable(component);
        if (withData) Area.delete(component.path);
    }

    collectChildrenBlocks(names, savePoint) {
        console.log(names);
        for (let i = names.length - 1; i > -1; i--) {
            const element = this.children[names[i]].element;
            console.log(names[i], element);
            console.log(savePoint);
            if (element !== savePoint.previousSibling) Block.insert(element, savePoint);
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
        console.log('ENABLE', this.path);
        if (!this.vdom.isActive()) {
            this.vdom.enableReactive();
        }
        this.enabled = true;
    }
    
    /**
     * Деактивация компонента
     */
    disable() {
        if (!this.enabled) return;
        console.log('DISABLE', this.path);
        this.enabled = false;
    }

    die() {
        // TODO: Удалить все связанные в других местах объекты
    }

}

export default Component