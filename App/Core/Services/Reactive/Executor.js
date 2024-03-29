import Area from "../../Area.js";
import { Log } from '../../Service.js';

class Executor {

    static collectParams = { collect: true };

    /**
     * Выполнение кода из строки
     * @param {string} expr Выполняемый код
     * @param {object} ctx Данные
     * @param {boolean} isVoid TRUE - Не возвращать и возможность выполнить более одной инструкции, FALSE - Возвращает результат одной инструкции
     * @returns {any}
     */
    static call(expr, ctx, isVoid = false) {
        try {
            return new Function(`with(this){${isVoid?'':'return '}${expr}}`).bind(ctx)();
        } catch (err) {
            Log.send(
                [err.message, `Expression: '${expr}'`, ctx],
                [Log.TYPE_ERROR],
                'Call expression'
            );
        }
    }

    /**
     * Возвращает объект и его свойство, если в путь состоит из вложенных объектов
     * @param {string} path 
     * @param {object} ctx 
     * @returns {object|false|true} false - Если некорректный путь, true - Если нет вложенности
     */
    static search(path, ctx) {
        let prop;
        for (let i = path.length; i > 0; i--) {
            if (path[i] == '.' || path[i] == '[') {
                prop = path.slice(i+1, path[i] == '[' ? -1 : undefined);
                path = path.slice(0, i);
                break;
            }
        }
        if (!prop) return true;
        const target = this.call(path, ctx);
        if (!(target instanceof Object)) return false;
        return { target, prop };
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
            let val = this.call(expr, ctx, false);
            //Если первый раз, то собираем зависимости
            if (params && params.collect) {
                //Если выражение содержит голые данные
                if (!this.$target && data.component) {
                    console.error('NUDES DATA', val);
                    //Создаем для них свое свойство в данных компонента
                    const defined = Area.define(data.component.path.slice(0, -1), false, val);
                    //Дополняем текущие данные
                    this.$target = defined.target;
                    this.$prop = data.expr = expr = defined.prop;
                    val = defined.value;
                }
                //Сохраняем текущую функцию
                this.saveDependency(data, ctx, disactivable);
            }
            //Трансформируем изменения, если нужно
            if (data.transform) val = data.transform(val);
            //Если изменилось или грубо нужно обновить, изменяем значение и вызываем колбэк
            if (!('current' in data) || data.onceForce || params?.force || data.current !== val) {
                data.current = val;
                if (data.onceForce) data.onceForce = false;
                if (callback) {
                    if (!data.onceIgnore) callback(params);
                    else data.onceIgnore = false;
                }
            }
        }
        //Первый запуск функции
        this.$dep(this.collectParams);
    }

    /**
     * Сохранение в функции в зависимостях
     */
    static saveDependency(data, ctx, disactivable) {
        if (!this.$target) return;
        const dependency = this.$target.getHandler();
        //Создаем наблюдателя
        const watcher = { method: this.$dep };
        if (data.iterating) watcher.ignoreCount = true;
        let caller = null;
        if (disactivable) {
            watcher.enabled = true;
            caller = data;
        }
        //Получаем объект зависимости и записываем в нее функцию
        const inserted = dependency.add(this.$prop, watcher, caller);
        //Добавляем проверщик значении свойств
        if (data.checker) dependency.addChecker(this.$prop, data.checker);
        //После сохранения функции очищаем свойства, чтобы не мешало последующим сохранениям
        this.$dep = undefined;
        this.$prop = undefined;
        this.$target = undefined;
        this.$inners = undefined;
        if (ctx.$component) {
            //Даем знать компоненту откуда пришел наблюдатель, что он попал в данную зависимость "dependency"
            ctx.$component.addUsedDeps(dependency, inserted);
        }
    }

}

export default Executor