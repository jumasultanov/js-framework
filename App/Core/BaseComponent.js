import { Block, Parser, Log } from './Service.js';

class BaseComponent {

    //Все компоненты
    static items = {};
    static count = 0;
    static currentComplete = -1;

    /**
     * 
     * @param {*} path 
     */
    static find(path) {
        if (!(path instanceof Array) || !path.length) return null;
        let current = this.items[path[0]];
        if (!current) return null;
        for (let i = 1; i < path.length; i++) {
            if (!(path[i] in current.children)) return null;
            current = current.children[path[i]];
        }
        return current;
    }

    /**
     * Инициализация компонентов относительно HTML-блоков
     * @param {Element} parentElement Элемент, откуда начнется поиск компонентов
     */
    static init(parentElement) {
        try {
            this.items = Parser.start(parentElement);
        } catch(err) {
            Log.send(
                [`Cannot parse`, err.message],
                Log.TYPE_ERROR,
                'Component initialization'
            );
        }
        console.log(this.items);
        window.test = this.items;
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
     * Создание компонента для элемента
     * @param {Node} node Node-элемент
     * @param {string} name Название
     * @param {string[]} parentPath Путь родительского компонента 
     * @param {boolean} ready Предстартовые установки (парсинг элемента и определение данных)
     * @param {object|null} defaultVars Доп. данные
     * @returns {Component}
     */
    static createEmpty(element, name, parentPath = [], ready = true, defaultVars = null) {
        const component = new this({ element, name });
        component.updatePath(parentPath);
        if (ready) component.build().defineArea(defaultVars);
        return component;
    }
    /**
     * После загрузки всех контроллеров компонентов после обновления дерева
     */
    static completeLoadControllers() {
        this.currentComplete++;
        if (this.currentComplete == this.count) {
            try {
                this.enableAll(this.items);
            } catch (err) {
                Log.send(
                    [`Cannot enable`, err.message],
                    Log.TYPE_ERROR,
                    'Enable reactivity'
                );
            }
        }
    }
    
    /**
     * Активируем все компоненты
     * @param {Object} items Список компонентов
     */
    static enableAll(items) {
        if (items instanceof Object) {
            for (const component of Object.values(items)) {
                this.enable(component);
            }
        }
    }
    
    /**
     * Деактивируем все компоненты
     * @param {Object} items Список компонентов
     */
    static disableAll(items) {
        if (items instanceof Object) {
            for (const component of Object.values(items)) {
                this.disable(component);
            }
        }
    }

    /**
     * Активируем компонент и его дочерние компоненты
     * @param {Component} component 
     */
    static enable(component) {
        component.enable();
        this.enableAll(component.getChildren());
    }

    /**
     * Деактивируем компонент и его дочерние компоненты
     * @param {Component} component 
     */
    static disable(component) {
        component.disable();
        this.disableAll(component.getChildren());
    }

}

export default BaseComponent