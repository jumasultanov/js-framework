import Directive from "../Directive.js";
import Component from "../Component.js";
import { Executor, Transform } from "../Service.js";

class If {

    //Название конструкции
    static name = 'if';
    //Названия связанных конструкции
    static nextConstructions = ['else-if', 'else'];

    /**
     * Регистрация директивы
     */
    static boot() {
        //Добавляем слушателей на события
        Directive
            .include('onParse', this)
            .include('onExecute', this)
            .include('onDestroy', this);
    }

    /**
     * Событие при парсинге
     * @param {string} expr Выражение
     * @param {Node} node Элемент DOM
     * @param {object} data Данные конструкции
     * @param {Parser} parser Объект парсера
     * @returns {object} Должен возвращать объект из:
     *      {
     *          - {string} expr             - выражение, можно изменять
     *          - {object} list             - список блоков-компонентов
     *          - {string|null} next        - следующий блок конструкции, если нужно
     *          - {boolean} readyComponent  - cразу ли запускать компонент
     *      }
     */
    static onParse(expr, node, data, parser) {
        let list = {};
        //Указываем трансформацию значении
        data.transform = Transform.bool;
        //Собираем и сохраняем последующие блоки конструкции
        const next = parser.unionNodes(node.nextElementSibling, this.nextConstructions, list);
        return { expr, list, next, readyComponent: true }
    }

    /**
     * Событие при активации конструкции
     * @param {VNode} vnode 
     */
    static onExecute(vnode) {
        this.constr(vnode);
    }

    /**
     * Событие при уничтожении конструкции
     * @param {VNode} vnode 
     * @param {boolean} next Имя следующего блока конструкции
     */
    static onDestroy(vnode, next = 'if') {
        //Получаем данные
        let data = vnode.data.constr[next];
        if ('dependencies' in data) {
            //Удаляем наблюдателей
            for (const id of data.dependencies) {
                vnode.component.dependency.remove(id);
            }
        }
        //Удаляем компонент
        if (data.component instanceof Component && !data.component.isDestroyed()) {
            Component.die(data.component);
        }
        //Проходимся по следующим блокам
        if (data.next) this.onDestroy(vnode, data.next);
    }

    /**
     * Выполнение конструкции
     * @param {VNode} vnode 
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
            Executor.expr(data.expr, data, vnode.getVars(), true, () => {
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
     * @param {VNode} vnode 
     * @param {string} next Имя следующего блока конструкции
     * @param {boolean} enable Включить или отключить
     */
    static constrNextActive(vnode, next, enable = true) {
        let data = vnode.data.constr[next];
        //Значение изменяем
        if (enable) data.current = false;
        if ('dependencies' in data) {
            //После проверок перебираем и изменяем активность функции
            for (const id of data.dependencies) {
                vnode.component.dependency.setActive(id, enable);
            }
        }
        //Проходимся по следующим блокам
        if (data.next) this.constrNextActive(vnode, data.next, enable);
    }

}

export default If