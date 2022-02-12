const call = (expr, ctx) => new Function(`with(this){${`return ${expr}`}}`).bind(ctx)();

class Directives {

    static $dep;
    static collectParams = { collect: true };

    static methodExpression = /^([a-z][\w\.]+)(\(.*\)){0,1}$/i;

    static exec(methodName, el, name, val, ctx) {
        if (methodName) {
            let method = this[methodName];
            // TODO: Надо будет разобрать события, т.к. пока только они сюда попадают
            //      Изменил $dep1, т.к. иначе они записываются в зависимости, а это не нужно
            this.$dep1 = () => method(el, name, val, ctx);
            let result = this.$dep1();
            this.$dep1 = undefined;
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
        this.$dep = params => {
            let val = call(expr, ctx);
            //Если первый раз, то собираем зависимости
            if (params && params.collect) {
                //console.log('%c%s', 'font-size:1.4em;color:green;padding:3px 0px 3px 10px', 'GET_DEP: '+this.$prop);
                //console.log(this.$target.getHandler());
                if (this.$dep instanceof Function) {
                    this.$target.getHandler().add(this.$prop, this.$dep);
                } else if (this.$dep instanceof Object) {
                    this.$target.getHandler().add(this.$prop, this.$dep.func, this.$dep.use);
                }
                //После выполнения выражения очищаем флаги, чтобы не мешало последующим
                this.$dep = undefined;
                this.$prop = undefined;
                this.$target = undefined;
            }
            //console.log('%c%s', 'font-size:1.4em;color:#f66;padding:3px 0px 3px 10px;', expr.trim()+' -> '+JSON.stringify(val));
            //Трансформируем изменения, если нужно
            if (data.transform) val = data.transform(val);
            //Если изменилось или грубо нужно обновить, изменяем значение и вызываем колбэк
            if (!('current' in data) || params?.force || data.current !== val) {
                data.current = val;
                if (callback) callback(params);
            }
        }
        //Если зависимость может быть отключена, актуально для IF, SWITCH
        if (disactivable) {
            this.$dep = { 
                func: this.$dep,
                use: data
            };
            this.$dep.func(this.collectParams);
        } else this.$dep(this.collectParams);
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

}

export default Directives