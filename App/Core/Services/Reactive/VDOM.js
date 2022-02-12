class VDOM {

    //Список конструкции VNode
    items = new Set();
    //Флаг активности
    enabled = false;

    /**
     * Добавляем массив VNode в список
     * @param {VNode[]} vnodes 
     */
    add(vnodes) {
        for (const vnode of vnodes) {
            this.items.add(vnode);
        }
    }

    /**
     * Активна ли реактивность
     * @returns {boolean}
     */
    isActive() {
        return this.enabled;
    }

    /**
     * Запуск реактивности
     */
    enableReactive() {
        this.directives(this.items);
        this.enabled = true;
    }

    /**
     * Запуск выражении VNode
     * @param {VNode[]} children 
     */
    directives(children) {
        if (!children.size) return;
        for (const child of children) child.setDirectives();
    }

}

export default VDOM