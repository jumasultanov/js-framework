class VDOM {

    //Список конструкции VNode
    items = [];
    //Объект данных
    vars;

    /**
     * Добавляем массив VNode в список
     * @param {VNode[]} vnodes 
     */
    add(vnodes) {
        for (const vnode of vnodes) {
            this.items.push(vnode);
            vnode.setVDOM(this);
        }
    }

    /**
     * Возвращает объект данных
     * @returns {Proxy|null}
     */
    getVars() {
        return this.vars;
    }

    /**
     * Устанавливаем данные для конструкции
     * @param {Proxy} vars 
     * @returns {this}
     */
    setVars(vars) {
        this.vars = vars;
        return this;
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
            let vnode = child.setDirectives();
            if (vnode) {
                if (vnode.isListItem) console.log(vnode);
                this.directives(vnode.children);
            }
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