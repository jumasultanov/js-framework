import { Block, Parser } from './Service.js';

class BaseComponent {

    //Все компоненты
    static items = {};
    static count = 0;
    static currentComplete = -1;

    /**
     * 
     * @param {*} path 
     */
    static getComponent(path) {
        // TODO: 
    }

    /**
     * Инициализация компонентов относительно HTML-блоков
     * @param {Element} parentElement Элемент, откуда начнется поиск компонентов
     */
    static init(parentElement) {
        this.items = Parser.start(parentElement);
        console.log(this.items);
        //На случай, когда нет контроллеров currentComplete смещается на -1
        //  и дополнительно вызывется после перебора (на случай синхронного выполнения)
        //Если контроллеры присутствуют, то смещение изчезает
        //  и реактивность запускается после загрузки последнего контроллера (на случай асинхронного выполнения)
        this.completeLoadControllers();
    }

    /**
     * Инициализация компонента в контексте существующей иерархий
     * @param {string[]} path 
     * @param {Element} parentElement 
     */
    static initPart(path, parentElement) {
        // TODO: 
    }

    /**
     * Инициализация компонента для блока
     * @param {Element} element 
     * @param {Component} parentComponent
     * @returns {component|false}
     */
    static create(element, parentComponent = null) {
        const info = Block.getInfo(element);
        if (!info) return false;
        info.element = element;
        const component = new this(info);
        if (parentComponent) parentComponent.appendChild(component);
        else component.updatePath();
        component.build().loadControllers();
        return component;
    }

    /**
     * После загрузки всех контроллеров компонентов после обновления дерева
     */
    static completeLoadControllers() {
        this.currentComplete++;
        if (this.currentComplete == this.count) {
            this.enableAll(this.items);
        }
    }
    
    /**
     * Активируем все компоненты
     * @param {Object} items Список компонентов
     */
    static enableAll(items) {
        if (items instanceof Object) {
            // TODO: пробегаемся по дереву и включаем компонент
            // По условию что конструкции в родительском компоненте
            // не блокиует данный компонент

            // TO CONTINUE: Сделать конструкцию IF
            for (const component of Object.values(items)) {
                component.enable();
                if (!component.isHidden()) this.enableAll(component.children);
            }
        }
    }

}

export default BaseComponent