const call = (expr, ctx) => new Function(`with(this){${`return ${expr}`}}`).bind(ctx)();

class Directives {

    static $dep;

    static methodExpression = /^([a-z][\w\.]+)(\(.*\)){0,1}$/i;

    static exec(methodName, el, name, val, ctx) {
        if (methodName) {
            let method = this[methodName];
            this.$dep = () => method(el, name, val, ctx);
            let result = this.$dep();
            this.$dep = undefined;
            if (typeof result == undefined) return true;
            return result;
        }
        return false;
    }

    /**
     * Инициализация выражения в Dependency
     * @param {string} expr Выражение
     * @param {object} data Данные выражения
     * @param {object} ctx Область данных
     * @param {boolean} disactivable Отключаемая функция в Dependency
     * @param {function|null} callback Функция, которая выполняется после изменения выражения
     */
    static expr(expr, data, ctx, disactivable = false, callback = null) {
        this.$dep = () => {
            let val = call(expr, ctx);
            if (data.transform) val = data.transform(val);
            if (data.current !== val) {
                data.current = val;
                if (callback) callback();
            }
        }
        if (disactivable) {
            this.$dep = { 
                func: this.$dep,
                use: data
            };
            this.$dep.func();
        } else this.$dep();
        this.$dep = undefined;
    }

    /**
     * ------------ IMPORTANT ----------------
     * TODO:
     *      сначала изменяются данные
     *      обновляются флаги в Virt.DOM
     *      потом когда прекращаются изменения, то обновляем DOM
     *      событие прекращения изменения данных надо будет отловить
     *      обновление DOM делаем через класс VNode или VDOM
     */

    /**
     * Установка событии
     * @param {NodeElement} el Элемент прослушки
     * @param {string} name Название события
     * @param {string} val Название метода в объекте данных
     * @param {object|null} ctx Объект данных
     */
    static on(el, name, val, ctx) {
        // TODO: add modes for events, example: @click.mode="click"
        // Сразу фиксируется функция события, 
        // не предполагает будущих изменении на другие функции
        if (!val) val = "''";
        let method = '',
            args = '',
            match = Directives.methodExpression.exec(val.trim());
        if (match) {
            if (ctx[val.trim()] instanceof Function) {
                method = match[1];
                args = match[2]||'(event)';
            }
        }
        el.getNode()[`on${name}`] = () => {
            if (method) return call(`${method}.call(this, ${args.substring(1, args.length - 1)})`, ctx);
            return call(val, ctx);
        };
    }

    static for() {
        console.log('TEST');
        // TODO:
        /* 
        const items = call(val, ctx);
        if (!el.$each) {
            el.$each = el.children[0];
        }
        el.innerText = '';
        for (let it of items) {
            const childNode = document.importNode(el.$each);
            const childCtx = {$parent: ctx, $it: it};
            childNode.$q = childCtx;
            Q(childNode, childCtx);
            el.appendChild(childNode);
        }
        */
    }

    static model() {
        // TODO:
        /*
        el.value = ctx[val];
        el.oninput = () => (ctx[val] = el.value);
        */
    }

}

export default Directives