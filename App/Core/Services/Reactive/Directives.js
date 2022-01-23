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

    static expr(expr, ctx, data, check = true, callback) {
        this.$dep = () => {
            let val = call(expr, ctx);
            if (check) {
                if (data.current !== val) {
                    data.current = val;
                    data.changed = true;
                    if (callback) callback();
                } else {
                    data.changed = false;
                }
            } else delete data.changed;
            return val;
        }
        let result = this.$dep();
        this.$dep = undefined;
        return result;
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

    static bind(el, name, val, ctx) {
        if (!val) val = "''";
        console.log(val, ctx);
        console.log(el, name);
        el.setAttribute(name, call(val, ctx));
    }

    static bindClass(el, name, val, ctx) {
        /**
         * TODO: 
         */
        //el.setAttribute('class', [].concat(result).join(' '));
    }

    static bindStyle(el, name, val, ctx) {
        /**
         * TODO:
         */
        //el.removeAttribute('style');
        //for (const k in result) el.style[k] = result[k];
    }

    static prop(el, name, val, ctx) {
        if (name in el) el[name] = call(val, ctx);
    }

    static text(el, _, val, ctx) {
        el.textContent = call(val, ctx);
    }

    static html(el, _, val, ctx) {
        el.innerHTML = call(val, ctx);
    }

    static if(el, _, val, ctx) {
        let success = call(val, ctx);
        if (success) {
            //if (!el.parentElement) 
            //TODO: найти род.элемент при построении virt.DOM
        } else {
            el.parentElement.replaceChild(new Comment(), el);
            return false;
        }
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