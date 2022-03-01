class NodeElement {

    node;

    constructor(node) {
        this.node = node;
    }

    /**
     * Возвращает DOM элемент
     * @returns Node
     */
    getNode() {
        return this.node;
    }

    /**
     * Является ли элемент текстовым
     * @returns boolean
     */
    isText() {
        return this.node.nodeType == Node.TEXT_NODE;
    }

    text(text) {
        this.node.textContent = text;
    }

    attr(key, value) {
        this.node.setAttribute(key, value);
    }

    prop(key, value) {
        this.node[key] = value;
    }

    addClass(key) {
        this.node.classList.add(key);
    }

    removeClass(key) {
        this.node.classList.remove(key);
    }

}

export default NodeElement