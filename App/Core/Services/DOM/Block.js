import { AppConfig } from "../../../config.js";

class Block {

    /**
     * Перебор Node-элементов с вызовом check на каждой итерации
     * @param {Node} element Элемент
     * @param {boolean} include Будет ли прверяться переданный родительский элемент
     * @param {boolean} onlyElements Ищутся ли только элементы c типом Node.ELEMENT_NODE
     * @param {function} check Функция проверки на каждом найденном элементе.
     *      Должна возвращать:
     *          true -  если нужен поиск в дочерних элементах;
     *          false - если не нужен;
     *          {Node} - если нужно передать элемент, с которого продолжиться поиск.
     * @return {null|Node} Если нужно продолжить поиск с текущего элемента, то он возвращается
     */
    static find(element, include, onlyElements, check) {
        let walk = !include || check(element);
        if (walk instanceof Node) return walk;
        if (walk) {
            const nextProp = onlyElements ? 'nextElementSibling' : 'nextSibling';
            const firstChildProp = onlyElements ? 'firstElementChild' : 'firstChild';
            let child = element[firstChildProp];
            while(child) {
                const breakpoint = this.find(child, true, onlyElements, check);
                if (breakpoint instanceof Node) child = breakpoint[nextProp];
                else child = child[nextProp];
            }
        }
        return null;
    }

    /**
     * Возвращает данные аттрибута блока-компонента
     * @param {Element} element DOM Элемент
     * @returns {Object[]}
     */
    static getInfo(element) {
        const block = element.getAttribute(AppConfig.componentAttr) || null;
        if (block === null) return false;
        element.removeAttribute(AppConfig.componentAttr);
        let name = block;
        let controllerNames = [];
        if (block.indexOf(':')>-1) {
            const div = block.split(':');
            name = div.shift();
            controllerNames = div;
        }
        if (!name) return false;
        return { name, controllerNames }
    }

}

export default Block