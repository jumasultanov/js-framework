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
     * Остановка реактивности
     */
    disableReactive() {
        this.enabled = false;
        this.directives(this.items, true);
    }

    /**
     * Запуск выражении VNode
     * @param {VNode[]} children 
     */
    directives(children, unset = false) {
        if (!children.size) return;
        for (const child of children) {
            if (unset) child.unsetDirectives();
            else child.setDirectives();
        }
    }

}

export default VDOM