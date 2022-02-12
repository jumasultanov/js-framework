import If from './Directives/If.js';
import For from './Directives/For.js';

class Directive {

    static boot() {
        this.listen(If).listen(For);
    }

    /**
     * Подключение директив
     * @returns {this}
     */
    static listen(directive) {
        if ('boot' in directive) directive.boot();
        return this;
    }

    /**
     * Отключение директив
     * @returns {this}
     */
    static removeListener(directive) {
        for (prop of Object.keys(this)) this.exclude(prop, directive);
        return this;
    }

    static include(prop, directive) {
        if (!this[prop]) this[prop] = {};
        this[prop][directive.construction] = directive;
        return this;
    }

    static exclude(prop, directive) {
        if (this[prop] && directive.construction in this[prop]) {
            delete this[prop][directive.construction];
            if (Object.keys(this[prop]).length === 0) this[prop] = undefined;
        }
        return this;
    }

    static on(prop, ...args) {
        if (this[prop]) {
            for (const name in this[prop]) {
                const directive = this[prop][name];
                const result = directive[prop].apply(directive, args);
                if (result !== undefined) return result;
            }
        }
    }

    static onName(name, prop, ...args) {
        if (this[prop] && this[prop][name]) {
            return this[prop][name][prop].apply(this[prop][name], args);
        }
    }

}


export default Directive