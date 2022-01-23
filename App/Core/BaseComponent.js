import { Block } from './Service.js';

class BaseComponent {

    //Все компоненты
    static items = {};
    static count;
    static currentComplete;

    /**
     * 
     * @param {*} path 
     */
    static getComponent(path) {
        // TODO: 
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
        //Получаем все блоки из DOM
        let blocks = Block.getAll(parentElement);
        //Контроль загрузок контроллеров
        this.count = blocks.length;
        this.currentComplete = 0;
        //Формируем дерево
        blocks.forEach(obj => {
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
                item.updatePath();
            }
            prev = item;
            // Загружаем контроллеры
            item.loadControllers();
        });
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
     * @param {Object} element Список компонентов
     */
    static enableAll(element) {
        if (element instanceof Object) {
            // TODO: пробегаемся по дереву и включаем компонент
            // По условию что конструкции в родительском компоненте
            // не блокиует данный компонент
            for (const obj of Object.values(element)) {
                obj.enable();
                this.enableAll(obj.children);
            }
        }
    }

}

export default BaseComponent