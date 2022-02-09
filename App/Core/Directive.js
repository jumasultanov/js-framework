import If from './Directives/If.js';
import For from './Directives/For.js';

class Directive {

    static registered = {};

    static boot() {
        this.on(If).on(For);
    }

    /**
     * Подключение директив
     */
    static on(directive) {
        this.registered[directive.construction] = directive;
        return this;
    }

    /**
     * Отключение директив
     */
    static off(directive) {
        delete this.registered[directive.construction];
        return this;
    }

    /**
     * 
     * @param {*} construction 
     * @param {*} expr 
     * @param {*} node 
     * @param {*} data 
     * @param {*} parser 
     * @returns 
     */
    static parse(construction, expr, node, data, parser) {
        if (construction in this.registered) {
            //Директива должна возвращать объект из:
            // @param {string} expr             выражение, если изменилось
            // @param {object} list             список блоков-компонентов
            // @param {string|null} next        следующий блок конструкции, если нужно
            // @param {boolean} readyComponent  cразу ли запускать компонент
            return this.registered[construction].parse(expr, node, data, parser);
        }
        return false;
    }

}


export default Directive