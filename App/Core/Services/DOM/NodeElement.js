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

    get(selector) {
        return this.node.querySelectorAll(selector);
    }

    is(...types) {
        return types.includes(this.node.type);
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

    isAttr(key) {
        return this.node.hasAttribute(key);
    }

    attr(key, value) {
        if (value === undefined) return this.node.getAttribute(key);
        this.node.setAttribute(key, value);
    }

    prop(key, value) {
        if (value === undefined) return this.node[key];
        this.node[key] = value;
    }

    addClass(key) {
        this.node.classList.add(key);
    }

    removeClass(key) {
        this.node.classList.remove(key);
    }

    addStyle(key, value) {
        this.node.style.setProperty(key, value);
    }

    removeStyle(key) {
        this.node.style.removeProperty(key);
    }

}

export default NodeElement