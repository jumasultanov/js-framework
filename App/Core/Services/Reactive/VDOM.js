class VDOM {

    //Список конструкции VNode
    items = [];
    //Флаг активности
    enabled = false;

    /**
     * Добавляем массив VNode в список
     * @param {VNode[]} vnodes 
     */
    add(vnodes) {
        for (const vnode of vnodes) {
            this.items.push(vnode);
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
        if (!children.length) return;
        children.forEach(child => {
            //let vnode = child.setDirectives();
            child.setDirectives();
        });
    }

}

export default VDOM