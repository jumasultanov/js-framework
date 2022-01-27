class VDOM {

    //Список конструкции VNode
    items = [];

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
     * Запуск реактивности
     */
    enableReactive() {
        /**
         * TODO:
         *      + данные реактивны
         *      + виртуальный DOM готов
         *      - написать реактивное изменение элементов DOM
         */
        this.directives(this.items);
        //this.update(this.items);
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

    /**
     * Обновление DOM
     */
    /*update(children) {
        if (!children.length) return;
        children.forEach(child => {
            let vnode = child.update();
            if (vnode) {
                this.update(vnode.children);
            }
        });
    }*/

}

export default VDOM