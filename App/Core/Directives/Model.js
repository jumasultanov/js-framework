import { ParserConfig } from '../../config.js';
import { Executor, Helper, NodeElement, ObjectControl } from "../Service.js";

class Model {

    static name = 'model';

    /**
     * Обработка режимов для связок полей со свойствами
     * @param {Node} node 
     * @param {object} data 
     */
     static modes(node, data) {
        node = new NodeElement(node);
        let number = false;
        if (data.modes) {
            for (const mode of data.modes) {
                if (mode == 'number') number = true;
            }
        }
        //Если есть может быть внутренняя конструкция цикла
        if (node.is('select-one', 'select-multiple')) {
            for (const el of node.get(`option`)) {
                let constr = false;
                for (const attr of el.getAttributeNames()) {
                    if (attr.startsWith(ParserConfig.prefixConstr)) {
                        constr = true;
                        break;
                    }
                }
                if (!constr) continue;
                //Ставим событие на элемент, если внутренняя конструкция инициализировалась
                el.addEventListener('updated', () => {
                    data?.innerMounted();
                })
            }
        }
        //Указываем метод проверки числовых значении
        if (number || node.is('number', 'range')) {
            data.numeric = true;
            data.checker = value => {
                //Проверка на ограничения в диапазоне
                let num = parseFloat(value);
                data.onceForce = true;
                if (isNaN(num)) return num;
                return Helper.limit(
                    num,
                    node.prop('min') ? +node.prop('min') : -Infinity,
                    node.prop('max') ? +node.prop('max') : Infinity
                );
            }
        } else if (
            node.is('text', 'hidden', 'textarea', 'password', 'search') &&
            (node.isAttr('minlength') || node.isAttr('maxlength'))
        ) {
            //Указываем метод проверки длины строк
            data.checker = (value, oldValue) => {
                if (value.length < node.prop('minLength')) {
                    data.onceForce = true;
                    return oldValue;
                }
                let max = node.prop('maxLength');
                if (max > -1 && value.length > max) {
                    data.onceForce = true;
                    return value.substring(0, max);
                }
                return value;
            }
        }
    }

    /**
     * Установка связки полей и свойств
     * @param {VNode} vnode 
     */
     static set(vnode) {
        if (vnode.data.model) {
            const data = vnode.data.model;
            let watcher = null;
            data.method = 'change';
            //Для каждого типа полей свои методы
            if (vnode.node.is('checkbox')) {
                watcher = this.checkbox(vnode);
            } else if (vnode.node.is('radio')) {
                watcher = this.radio(vnode);
            } else if (vnode.node.is('select-multiple')) {
                watcher = this.selectMultiple(vnode);
            } else {
                watcher = this.text(vnode);
            }
            data.vars = vnode.getVars();
            //data.expr содержит только название свойства, выражения не поддерживаются
            let found = Executor.search(data.expr, vnode.getVars());
            if (found === false) return;
            if (found !== true) {
                data.expr = found.prop;
                data.vars = found.target;
            }
            Executor.expr(data.expr, data, data.vars, false, watcher);
            vnode.node.getNode().addEventListener(data.method, data.handler);
        }
    }

    /**
     * Поле checkbox
     *      - model: boolean|string|number|string[]|number[]
     *      - варианты использования: 
     *          атрибуты: true-value - значение указывается при checked==true | false-value - при checked==false
     *          boolean - значение напрямую связан с checked
     *          string[]|number[] - значения добавляются в массив из атрибута value
     * @param {VNode} vnode 
     * @returns {function}
     */
    static checkbox(vnode) {
        const data = vnode.data.model;
        data.handler = event => {
            if (Array.isArray(data.current)) {
                //Получаем флаг, значение и позиция в массиве
                let checked = event.target.checked;
                let value = this.getValue(vnode);
                let index = data.current.indexOf(value);
                data.onceIgnore = true;
                //Добавляем, если нет в массиве, и удаляем, если есть относительно checked
                if (checked && index === -1) data.current.push(value);
                else if (!checked && index > -1) data.current.splice(index, 1);
            } else {
                let value = event.target.checked;
                //Получаем значения, если указаны атрибуты или хотя один атрибут относительно checked
                if (value && event.target.hasAttribute('true-value')) value = event.target.getAttribute('true-value');
                else if (!value && event.target.hasAttribute('false-value')) value = event.target.getAttribute('false-value');
                data.onceIgnore = true;
                data.vars[data.expr] = value;
            }
        }
        return () => {
            // TODO: возможно потребуется переделать, т.к. при каждом обновлении массива, он перебирается для каждого model
            // TODO: не самое эффективное решение, 
            //       т.к. для каждого чекбокса свой vnode и при изменении списка выбранных срабатывают все (спрведливо для групп чекбоксов)
            let checked = false;
            if (Array.isArray(data.current)) {
                //Проверка на наличие в массиве
                checked = data.current.includes(this.getValue(vnode));
            } else {
                if (vnode.node.isAttr('true-value')) {
                    if (data.current === this.getValue(vnode, 'true-value')) checked = true;
                } else {
                    if (data.current === true) checked = true;
                }
            }
            vnode.node.prop('checked', checked);
        }
    }

    /**
     * Поле radio
     *      - model: string|number
     * @param {VNode} vnode 
     * @returns {function}
     */
    static radio(vnode) {
        const data = vnode.data.model;
        data.handler = event => {
            data.vars[data.expr] = event.target.value;
        }
        return () => {
            vnode.node.prop('checked', this.getValue(vnode) === data.current);
        }
    }

    /**
     * Поле select[multiple]
     *      - model: string[]|number[]
     * @param {VNode} vnode 
     * @returns {function}
     */
    static selectMultiple(vnode) {
        // TODO: Постоянный перебор при изменении для большого кол-ва элементов
        //          может долго выполняться, надо будет изменить, если это необходимо
        const data = vnode.data.model;
        data.handler = event => {
            //Перебираем элементы и находим активные
            const values = [];
            for (const option of event.target.selectedOptions) {
                values.push(this.getValue(vnode, false, option.value));
            }
            data.onceIgnore = true;
            //Заменяем предыдущие элементы на активные
            data.current.splice(0, data.current.length, ...values);
        }
        data.innerMounted = params => {
            if (data.current instanceof Object) {
                if (params?.collect) {
                    //Наблюдение за изменениями в объекте
                    // TODO: не работает, если указали вложенный объект выбранных
                    ObjectControl.setRroto(data.current, vnode.component.path, data.expr, '$modelSelect');
                } else {
                    //Перебираем элементы и изменяем статус активного
                    for (const option of vnode.node.getNode().options) {
                        if (
                            data.current.includes(
                                this.getValue(vnode, false, option.value)
                            )
                        ) option.selected = true;
                        else option.selected = false;
                    }
                }
            }
        }
        return data.innerMounted;
    }

    /**
     * Остальные поля
     * @param {VNode} vnode 
     * @returns {function}
     */
    static text(vnode) {
        const data = vnode.data.model;
        data.method = 'input';
        data.handler = event => {
            data.onceIgnore = true;
            data.vars[data.expr] = event.target.value;
        }
        data.innerMounted = () => {
            vnode.node.prop('value', data.current);
        }
        return data.innerMounted;
    }

    /**
     * Трансформирует, если нужно и возвращает значение
     * @param {VNode} vnode
     * @param {string} attr Название атрибута со значением
     * @returns 
     */
    static getValue(vnode, attr = false, value = undefined) {
        const data = vnode.data.model;
        if (value === undefined) {
            if (attr) value = vnode.node.attr(attr);
            else value = vnode.node.prop('value');
        }
        if (data.numeric) value = parseFloat(value);
        return value;
    }

}

export default Model