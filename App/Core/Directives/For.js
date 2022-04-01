import Directive from "../Directive.js";
import Component from "../Component.js";
import { Executor, Block, ObjectControl } from "../Service.js";

class For {

    //Название конструкции
    static name = 'for';
    //Названия связанных конструкции
    static nextConstructions = ['for-else'];

    /**
     * Регистрация директивы
     */
    static boot() {
        //Добавляем слушателей на события
        Directive
            .include('onParse', this)
            .include('onExecute', this)
            .include('onDestroy', this);
    }

    /**
     * Событие при парсинге
     * @param {string} expr Выражение
     * @param {Node} node Элемент DOM
     * @param {object} data Данные конструкции
     * @param {Parser} parser Объект парсера
     * @returns {object} Должен возвращать объект из:
     *      {
     *          - {string} expr             - выражение, можно изменять
     *          - {object} list             - список блоков-компонентов
     *          - {string|null} next        - следующий блок конструкции, если нужно
     *          - {boolean} readyComponent  - cразу ли запускать компонент
     *      }
     */
    static onParse(expr, node, data, parser) {
        let list = {};
        //Деление выражения конструкции
        //на названия переменных в цикле и название в объекте данных, который перебирается
        let as = [];
        if (expr.indexOf(' in ') != -1) {
            [as, expr] = expr.split(' in ');
            expr = expr.trim();
            as = as.replace(/[\(\)\s]/g, '').split(',');
        }
        data.as = as;
        data.iterating = true;
        //Собираем и сохраняем последующие блоки конструкции
        const next = parser.unionNodes(node.nextElementSibling, this.nextConstructions, list);
        return { expr, list, next, readyComponent: false }
    }

    /**
     * Событие при активации конструкции
     * @param {VNode} vnode 
     */
    static onExecute(vnode) {
        this.constr(vnode);
    }

    /**
     * Событие при уничтожении конструкции
     * @param {VNode} vnode 
     */
    static onDestroy(vnode) {
        let data = vnode.data.constr.for;
        if (data.next) {
            const forElse = vnode.data.constr[data.next];
            if (!forElse.component.isDestroyed()) {
                Component.die(forElse.component);
            }
        }
    }

    /**
     * Выполнение конструкции
     */
    static constr(vnode) {
        let data = vnode.data.constr.for;
        let forElse;
        if (data.next) forElse = vnode.data.constr[data.next];
        //Выполнение выражения для цикла
        Executor.expr(data.expr, data, vnode.getVars(), false, params => {
            if (data.current instanceof Object) {
                //Обобщаем данные для конкретного изменения
                this.vnode = vnode;
                this.data = data;
                this.namePrefix = `${data.component.name}:`;
                const count = Object.keys(data.current).length;
                if (count && forElse && forElse.component.isActive()) {
                    vnode.component.removeChild(forElse.component, vnode.data.inserted);
                }
                if (params && 'change' in params) {
                    this.componentChange(params);
                    if (count > 0) return;
                } else {
                    //Если уже есть список добавленных, то очищаем его
                    // TODO: При замене объекта или массива, нужно сравнивать элементы массива, чтобы удалить те, которые отсутствуют
                    //          Потом вставить список компонентов, которых не хватает, допустим перезаписали массив с помощью filter и т.д.
                    if (vnode.data.inserted.size) {
                        vnode.component.clearChildren(vnode.data.inserted, true);
                    }
                    // TODO: data.expr лучше не использовать, т.к. в выражение может указана операция, типа вызов функции
                    //  Если уже есть, то не добавлять, хотя зависит от того, куда добавляется
                    //Наблюдение за изменениями в объекте
                    ObjectControl.setRroto(data.current, data.component.path.slice(0, -1), data.expr, '$iterating');
                    //Обновляем весь список
                    if (count) return this.componentPush(Object.keys(data.current));
                }
            }
            if (forElse) {
                //Если нет данных в списке, то выполняем конструкцию ELSE
                vnode.component.replaceChildren([forElse.component], vnode.data.space, vnode.data.inserted);
            }
        });
    }

    /**
     * Изменение компонентов в перебранном объекте
     * @param {object} params 
     */
    static componentChange(params) {
        const key = params.index;
        if (params.change == ObjectControl.ACTION_PUSH)     return this.componentPush(key);
        if (params.change == ObjectControl.ACTION_MOVE)     return this.componentRenameAll(key);
        if (params.change == ObjectControl.ACTION_REVERSE)  return this.componentReverse();
        if (params.change == ObjectControl.ACTION_SORT)     return this.componentSort();
        if (params.change == ObjectControl.ACTION_DELETE)   return this.componentDelete(key);
        if (params.change == ObjectControl.ACTION_REPLACE)  return this.componentReplace(key);
    }

    /**
     * Вставка компонентов по ключам
     * @param {string[]} keys 
     */
    static componentPush(keys) {
        let before = this.vnode.data.space;
        //Если передали объект, который содержит индекс, перед которым нужно вставить
        if (!Array.isArray(keys)) {
            const comp = this.getComp(keys.before);
            if (comp) before = comp.element;
            keys = keys.keys;
        }
        //Создаем фрагмент и добавляем туда элементы компонентов
        const fragment = Block.getFragment();
        for (const key of keys) {
            this.componentInsert(key, fragment, true);
        }
        //Вставка фрагмента перед before
        Block.insert(fragment, before);
    }

    /**
     * Перемещение индексов компонентов
     * @param {number[]} limits Данные по перемещению [
     *          0: Первоначальный индекс, который надо переместить,
     *          1: Новый индекс для первоначального перемещаемого индекса,
     *          2: Кол-во элементов перемещения после указанного индекса
     *      ]
     */
    static componentRenameAll(limits) {
        const diff = Math.abs(limits[0] - limits[1]);
        if (!diff) return;
        const isDown = limits[0] < limits[1];
        if (isDown) {
            //Перебираем с конца вниз
            for (let i = limits[2] - 1; i >= 0; i--) {
                const newK = limits[0] + diff + i;
                this.componentRename(limits[0] + i, newK);
            }
        } else {
            //Перебираем с начала вверх
            for (let i = 0; i < limits[2]; i++) {
                const newK = limits[0] - diff + i;
                this.componentRename(limits[0] + i, newK);
            }
        }
    }

    /**
     * Переименовывание компонента
     * @param {number} fromKey Перемещаемый ключ
     * @param {number} toKey Новый ключ
     */
    static componentRename(fromKey, toKey) {
        //Ищем и переименовываем компонент и данные
        const comp = this.getComp(fromKey);
        if (!comp) return;
        this.vnode.component.renameChild(comp, this.namePrefix + toKey);
        //Меняем индекс в данных компонента
        comp.vars[this.getKey(this.data)] = String(toKey);
    }

    /**
     * Удаление компонента
     * @param {string|string[]} key 
     */
    static componentDelete(key) {
        //Если передан массив ключей
        if (Array.isArray(key)) {
            for (let i = 0; i < key.length; i++) this.componentDelete(key[i]);
            return;
        }
        //Ищем компонент по ключу и удаляем
        const comp = this.getComp(key);
        if (!comp) return;
        this.vnode.component.removeChild(comp, this.vnode.data.inserted, true);
    }

    /**
     * Создание и вставка компонента по ключу
     * @param {string} key 
     * @param {Node} space Элемент, внутрь которого будет вставлено
     * @param {boolean} append Если нужно вставить внутрь space
     */
    static componentInsert(key, space, append = false) {
        const data = this.data;
        //Клонируем из базового компонента с данными итерации
        const comp = data.component.clone(this.namePrefix + key, true, this.getObjectForCycle(data, key));
        //Актививуем его и вставляем
        this.vnode.component.insertChild(comp, space, this.vnode.data.inserted, append);
        //Добавляем наблюдателя за изменением значения "item"
        comp.dependency.add(this.getItem(data), {
            method: value => {
                ObjectControl.skipUpdate = true;
                let obj = comp.vars[this.getItems(data)];
                let key = comp.vars[this.getKey(data)];
                obj[key] = value;
                ObjectControl.skipUpdate = false;
            }
        });
    }

    /**
     * Пересоздание компонента по ключу
     * @param {string} key 
     */
    static componentReplace(key) {
        const comp = this.getComp(key);
        //Меняем значение в компоненте
        if (this.data.current[key] instanceof Object) {
            //Получаем элемент, перед которым будем вставлять
            let before = this.vnode.data.space;
            if (comp) before = comp.element.nextElementSibling;
            //Удаляем компонент и добавляем
            this.componentDelete(key);
            this.componentInsert(key, before);
        } else {
            comp.vars[this.getItem(this.data)] = this.data.current[key];
        }
    }

    /**
     * Переворачивание списка компонентов
     */
    static componentReverse() {
        const len = this.data.current.length;
        const half = Math.ceil((len - 1) / 2);
        //С предпоследнего элемента идем наверх и перемещаем перед спец.элементом
        for (let i = len - 1; i >= 0; i--) {
            const comp = this.getComp(i);
            if (!comp) continue;
            Block.insert(comp.element, this.vnode.data.space);
            //Если дошли до оставшейся половины, то меняем данные компонентов с противоположными
            if (i < half) {
                //Ищем нужный компонент
                const replaceKey = len - 1 - i;
                const replace = this.getComp(replaceKey);
                if (replace) {
                    //Меняем компоненты
                    this.vnode.component.swapChild(replace, comp);
                    replace.vars[this.getKey(this.data)] = String(i);
                    comp.vars[this.getKey(this.data)] = String(replaceKey);
                }
            }
        }
    }

    /**
     * Обновление компонентов относительно данных (после сортировки)
     */
    static componentSort() {
        const len = this.data.current.length;
        const item = this.getItem(this.data);
        //Начинаем проверять в конца
        for (let i = len - 1; i >= 0; i--) {
            const comp = this.getComp(i);
            if (!comp) continue;
            const value = this.data.current[i];
            //Если значения не совпадают, то ищем выше до этого индекса
            if (comp.vars[item] !== value) {
                for (let j = 0; j < i; j++) {
                    const replace = this.getComp(j);
                    if (!replace) continue;
                    //Если нашлось, то меняем местами компоненты и блоки
                    if (value === replace.vars[item]) {
                        this.vnode.component.swapChild(replace, comp, true);
                        replace.vars[this.getKey(this.data)] = String(i);
                        comp.vars[this.getKey(this.data)] = String(j);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Возвращает компонент по ключу итерации
     * @param {string} key 
     * @returns {Component}
     */
    static getComp(key) {
        return this.vnode.component.children[this.namePrefix + key];
    }

    /**
     * Возвращает объект данных для элемента перебираемого объекта или массивиа
     * @param {object} data Данные конструкции цикла
     * @param {string} key Название ключа
     * @returns {object}
     */
    static getObjectForCycle(data, key) {
        const obj = {};
        obj[this.getItem(data)] = data.current[key];
        obj[this.getKey(data)] = key;
        obj[this.getItems(data)] = data.current;
        return obj;
    }

    /**
     * Возвращает название значения итерируемого элемента
     * @param {object} data 
     * @returns {string}
     */
    static getItem(data) {
        return data.as[0]||'item';
    }

    /**
     * Возвращает название ключа итерируемого элемента
     * @param {object} data 
     * @returns {string}
     */
    static getKey(data) {
        return data.as[1]||'key';
    }

    /**
     * Возвращает название перебираемого объекта
     * @param {object} data 
     * @returns {string}
     */
    static getItems(data) {
        return data.as[2]||'items';
    }

}

export default For