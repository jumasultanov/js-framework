import { DOM } from './Service.js';

class Component {

    //Все компоненты
    static items = {};
    //Глобавльные переменные для всех компонентов
    static data = {};

    children = {};

    constructor(data) {
        Object.assign(this, data);
    }

    /**
     * Добавление дочернего компонента
     * @param {Component} component 
     */
    appendChild(component) {
        this.children[component.name] = component;
    }

    /**
     * Инициализация модуля компонентов
     * @returns {Component}
     */
    static init() {
        this.setGlobals();
        return this;
    }

    /**
     * Добавление данных из глобального объекта
     */
    static setGlobals() {
        if (window.globals instanceof Object) this.data = window.globals;
    }

    static getComponent(path) {
        // TODO: 
    }

    /**
     * Обновление значения по пути
     * @param {string} path Путь к значению объекта
     * @param {string} value Значение
     */
    static setData(path, value) {
        // TODO: key maybe as path to object 'keyParent2.keyParent1.key'
    }

    /**
     * Обновление компонентов относительно HTML-блоков
     * @param {Element} parentElement Элемент, откуда будут браться блоки
     */
    static update(parentElement) {
        this.updateTreeComponents(parentElement);
        console.log(this.items);
    }

    /**
     * Обновление дерева компонентов из HTML-блоков
     * @param {Element} parentElement Элемент, откуда будут браться блоки
     */
    static updateTreeComponents(parentElement) {
        let prev = null, levels = [], level = -1;
        DOM.getBlocks(parentElement).forEach(obj => {
            const item = new this(obj);
            //Если есть родительский блок
            if (item.parent) {
                //Если родитель совпадает с предыдущим элементом, то это его дочерний элемент
                if (item.parent == prev.element) {
                    //Добавление к родителю
                    prev.appendChild(item);
                    //Добавляем уровень
                    level++;
                    levels.push(item);
                } else {
                    //Если родитель не совпадает с предыдущим родителем, то ищем родителя в более высоком уровне
                    if (item.parent != prev.parent) {
                        //Ищем родительский уровень
                        level--;
                        while (level >= 0) {
                            if (levels[level].element == item.parent) break;
                            level--;
                        }
                        //Убираем уровни ниже
                        levels.splice(level + 1);
                        //Добавление к родителю
                        levels[level].appendChild(item);
                        //Добавляем уровень
                        level++;
                        levels.push(item);
                    } else {
                        //Добавление к родителю соседа
                        levels[level - 1].appendChild(item);
                    }
                }
            } else {
                //Если нет родительского блока
                level = 0;
                levels = [item];
                this.items[item.name] = item;
            }
            prev = item;
        })
    }

}

export default Component