import Directive from "../Directive.js";

class For {

    static construction = 'for';
    static nextConstructions = ['for-else'];

    static boot() {
        Directive.on(this);
    }

    static parse(expr, node, data, parser) {
        let list = {};
        //Деление выражения конструкции
        //на названия переменных в цикле и название в объекте данных, который перебирается
        let as = [];
        if (expr.indexOf(' in ') != -1) {
            [as, expr] = expr.split(' in ');
            as = as.replace(/[\(\)\s]/g, '').split(',');
        }
        data.as = as;
        //Собираем и сохраняем последующие блоки конструкции
        const next = parser.unionNodes(node.nextElementSibling, this.nextConstructions, list);
        return { expr, list, next, readyComponent: false }
    }

}

export default For