class VNode {

    //HTML-элемент является текстом
    isText = false;
    //HTML-элемент содержит конструкцию
    isConstr = false;
    //Является элементом списка
    isListItem = false;
    //HTML-элемент
    node;
    //Параметры элемента
    data;
    //Вложенные объекты VNode[]
    children = [];

    constructor(node, data) {
        this.node = node;
        if (node.nodeType == 3) this.isText = true;
        if (Object.keys(data.constr||{}).length) this.isConstr = true;
        if (data.listExtension) this.isListItem = true;
        this.data = data;
    }

    /**
     * Является ли элемент конструкцией
     * @returns bool
     */
    hasConstr() {
        return this.isConstr;
    }

    /**
     * 
     * @returns 
     */
    getSearchable() {
        if (!this.data.searchable) return null;
        return this.data.listExtension[this.data.searchable];
    }

    /**
     * 
     * @param {VNode} vnode 
     * @returns 
     */
    isEqualListItem(vnode) {
        const thisItem = this.getSearchable();
        const otherItem = vnode.getSearchable();
        if (thisItem === null || otherItem === null) return false;
        return thisItem === otherItem;
    }

    /**
     * 
     * @param {VNode} vnode 
     * @param {number[]} ignoreIndexes 
     * @returns 
     */
    getIndexListItem(vnode, ignoreIndexes) {
        for (const i in this.children) {
            if (ignoreIndexes?.includes(i)) continue;
            if (vnode.isEqualListItem(this.children[i])) return true;
        }
        return false;
    }

    /**
     * 
     * @param {VNode} vnode 
     */
    mergeListItem(vnode) {
        console.error('Merge VNode don`t work!', vnode);
    }

    /**
     * Делаем объекты вложенными
     * @param {VNode[]} vnodes
     */
    addChildren(vnodes) {
        for (const vnode of vnodes) this.children.push(vnode);
    }

    /**
     * Возвращает объект-заготовку для параметров элемента
     * @returns {object}
     */
    static getEmptyData() {
        return {
            on: {}, //События
            attrs: {}, //Атрибуты
            style: null, //Стили
            class: null, //Классы
            props: {}, //Свойства элемента
            constr: {}, //Конструкции
            space: null, //Замененный коммент на блок
        };
    }

}

export default VNode