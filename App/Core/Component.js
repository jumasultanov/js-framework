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
    //Родительский блок {Node|null} из парсера
    parent;
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

    constructor(data) {
        super();
        Object.assign(this, data);
        //Парсим блок компонента
        this.vdom = Parser
            .build(this.element) //Строим списки VNode
            .getVDOM(); //Получаем списки
    }

    /**
     * Определяем область данных для компонента
     */
    defineArea() {
        this.vars = Area.find(this.path);
        return this;
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
     */
    loadControllers() {
        if (!this.controllerNames.length) {
            this.completeLoadControllers();
            return;
        }
        this.controllerNames.forEach(controllerName => this.loadController(controllerName));
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
        this.vdom.setVars(this.vars).enableReactive();
    }

    /**
     * Деактивация компонента
     */
    disable() {
        // TODO: 
    }

}

export default Component