class Block {

    /**
     * Возвращает массив данных элементов, которые содержат блоки-компоненты
     * @param {Element} parentElement DOM Элемент, в котором ведется поиск
     * @returns {Object[]}
     */
    static getAll(parentElement) {
        const items = [];
        parentElement
            .querySelectorAll('[m-block]:not([started])')
            .forEach(element => {
                const info = this.getInfo(element);
                items.push(Object.assign(info, {
                    element,
                    parent: element.parentElement.closest('[m-block]')
                }));
            });
        return items;
    }

    /**
     * Возвращает данные аттрибута блока-компонента
     * @param {Element} element DOM Элемент
     * @returns {Object[]}
     */
    static getInfo(element) {
        const block = element.getAttribute('m-block') || null;
        if (block === null) return false;
        let name = block;
        let controllerNames = [];
        if (block.indexOf(':')>-1) {
            const div = block.split(':');
            name = div.shift();
            controllerNames = div;
        }
        return { name, controllerNames }
    }

}

export default Block