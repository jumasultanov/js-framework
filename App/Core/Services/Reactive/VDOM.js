class VDOM {

    items = [];

    /**
     * Добавляем массив VNode в список
     * @param {VNode[]} vnodes 
     */
    add(vnodes) {
        for (const vnode of vnodes) this.items.push(vnode);
    }

    /**
     * Включаем реактивность
     */
    enableReactive(area) {
        /**
         * TODO:
         *      + данные реактивны
         *      + виртуальный DOM готов
         *      - написать реактивное изменение элементов DOM
         */
        /*console.log(area);
        console.log(this.items);
        VNode.setArea(area);
        this.directives(this.items);
        this.update();*/
    }

    directives(children) {
        /*if (!children.length) return;
        children.forEach(child => {
            let vnode = child.setDirectives();
            if (vnode) {
                if (vnode.isListItem) console.log(vnode);
                this.directives(vnode.children);
            }
        });*/
    }

    update() {

    }

}

export default VDOM