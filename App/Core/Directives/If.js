import Directive from "../Directive.js";

class If {

    static construction = 'if';
    static nextConstructions = ['else-if', 'else'];

    static boot() {
        Directive.on(this);
    }


    static parse(expr, node, data, parser) {
        let list = {};
        //Указываем трансформацию значении
        data.transform = this.transform;
        //Собираем и сохраняем последующие блоки конструкции
        const next = parser.unionNodes(node.nextElementSibling, this.nextConstructions, list);
        return { expr, list, next, readyComponent: true }
    }

    /**
     * Преобразование значения выражения
     * @param {any} value Значение
     * @returns {boolean}
     */
    static transform(value) {
        return !!value;
    }

}

export default If