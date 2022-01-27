import BaseComponent from './BaseComponent.js';
import Area from "./Area.js";
import { Log, Parser } from './Service.js';
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
    //Флаг отображения
    hidden = false;

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
     */
    defineArea() {
        let { proxy, vars } = Area.find(this.path);
        this.vars = proxy;
        this.controllers.forEach(controller => controller.mergeTo(vars));
        return this;
    }

    /**
     * Возвращает объект данных
     * @returns {Proxy|null}
     */
    getVars() {
        return this.vars;
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
     * Скрытый компонент
     * @returns {boolean}
     */
    isHidden() {
        return this.hidden;
    }

    /**
     * Видимость компонента
     * @param {boolean} view 
     */
    display(view = true) {
        this.hidden = !view;
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
     */
    updatePath(parentPath = []) {
        this.path = [...parentPath];
        this.path.push(this.name);
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
     * Активация компонента
     */
    enable() {
        //Включаем реактивность и обновляем DOM
        this.vdom.enableReactive();
    }

    /**
     * Деактивация компонента
     */
    disable() {
        // TODO: 
    }

}

export default Component