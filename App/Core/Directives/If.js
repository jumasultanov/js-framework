import Directive from "../Directive.js";
import { Directives } from "../Service.js";

class If {

    static construction = 'if';
    static nextConstructions = ['else-if', 'else'];

    static boot() {
        Directive
            .include('onParse', this)
            .include('onExecute', this);
    }

    static onParse(expr, node, data, parser) {
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

    static onExecute(vnode) {
        this.constr(vnode);
    }

    /**
     * Выполнение конструкции IF
     * @param {boolean} next Имя следующего блока конструкции
     */
    static constr(vnode, next = 'if') {
        //Получаем данные
        let data = vnode.data.constr[next];
        //Если дошли до ELSE, то без проверок выполняем вставку
        if (data.name == 'else') {
            vnode.component.replaceChildren([data.component], vnode.data.space, vnode.data.inserted);
        } else {
            //Флаг добавленности в Dependency, первый раз при изменении
            let used = false;
            //Выполнение выражения для условия
            Directives.expr(data.expr, data, vnode.getVars(), true, () => {
                //Если истинно,
                // то деактивируем функции в Dependency в последующих блоках конструкции и вставляем блок в DOM
                if (data.current) {
                    if (data.next) this.constrNextActive(vnode, data.next, false);
                    vnode.component.replaceChildren([data.component], vnode.data.space, vnode.data.inserted);
                } else {
                    if (data.next) {
                        if (used) {
                            //Активируем следующие функции в Dependency в последующих блоках конструкции
                            this.constrNextActive(vnode, data.next);
                        } else {
                            //Впервые дошли до выполнения следующего условия конструкции
                            used = true;
                            this.constr(vnode, data.next);
                        }
                    } else {
                        //Пустой блок, если ни одно условие не выполнилось и нет ELSE
                        vnode.component.replaceChildren([], vnode.data.space, vnode.data.inserted);
                    }
                }
            });
        }
    }
    
    /**
     * Изменение активности функции в Dependency
     * @param {string} next Имя следующего блока конструкции
     * @param {boolean} enable Включить или отключить
     */
    static constrNextActive(vnode, next, enable = true) {
        let data = vnode.data.constr[next];
        //Значение изменяем
        if (enable) data.current = false;
        if ('dependencies' in data) {
            for (const prop in data.dependencies) {
                //После проверок перебираем и изменяем активность функции
                for (const index of data.dependencies[prop]) {
                    vnode.component.dependency.setActive(prop, index, enable);
                }
            }
        }
        //Проходимся по следующим блокам
        if (data.next) this.constrNextActive(vnode, data.next, enable);
    }

}

export default If