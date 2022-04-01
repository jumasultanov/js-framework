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
        if (node.is('select-multiple')) {
            for (const el of node.get(`option`)) {
                let constr = false;
                for (const attr of el.getAttributeNames()) {
                    if (attr.startsWith(ParserConfig.prefixConstr)) {
                        constr = true;
                        break;
                    }
                }
                if (!constr) continue;
                el.addEventListener('updated', () => {
                    data?.innerMounted();
                })
            }
        }
        //Указываем метод проверки числовых значении
        if (number || node.is('range')) {
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
            // TODO: нужно решить с моментов других вариантов полей
            const data = vnode.data.model;
            let watcher = null;
            data.method = 'change';
            //Для чекбокса свои методы
            if (vnode.node.is('checkbox')) {
                watcher = this.checkbox(vnode);
            } else if (vnode.node.is('radio')) {
                watcher = this.radio(vnode);
            } else if (vnode.node.is('select-multiple')) {
                // TODO: сделать checkbox формировать значения в массив, если целевой объект массив
                watcher = this.selectMultiple(vnode);
            } else {
                watcher = this.text(vnode);
            }
            //data.expr содержит только название свойства, выражения не поддерживаются
            Executor.expr(data.expr, data, vnode.getVars(), false, watcher);
            vnode.node.getNode().addEventListener(data.method, data.handler);
        }
    }

    static checkbox(vnode) {
        const data = vnode.data.model;
        data.handler = event => {
            let value = event.target.checked;
            if (value && event.target.hasAttribute('true-value')) value = event.target.getAttribute('true-value');
            else if (!value && event.target.hasAttribute('false-value')) value = event.target.getAttribute('false-value');
            vnode.getVars()[data.expr] = value;
        }
        return () => {
            let checked = false;
            if (vnode.node.isAttr('true-value')) {
                let value = vnode.node.attr('true-value');
                if (data.numeric) value = parseFloat(value);
                if (data.current === value) checked = true;
            } else {
                if (data.current === true) checked = true;
            }
            vnode.node.prop('checked', checked);
        }
    }

    static radio(vnode) {
        const data = vnode.data.model;
        data.handler = event => {
            vnode.getVars()[data.expr] = event.target.value;
        }
        return () => {
            let value = vnode.node.prop('value');
            if (data.numeric) value = parseFloat(value);
            vnode.node.prop('checked', value === data.current);
        }
    }

    static selectMultiple(vnode) {
        const data = vnode.data.model;
        data.handler = event => {
            const values = [];
            for (const option of event.target.selectedOptions) {
                let value = option.value;
                if (data.numeric) value = parseFloat(value);
                values.push(value);
            }
            console.log('CHANGE', values);
            data.current.splice(0, data.current.length, ...values);
        }
        // TODO: Методы перехвата измении массива нужно вывести в отдельный класс,
        //          т.к они могут быть использованы не только для FOR
        data.innerMounted = params => {
            if (data.current instanceof Object) {
                //console.log('INPUT', data.current);
                console.log(params);
                if (params?.collect) {
                    //Наблюдение за изменениями в объекте
                    ObjectControl.setRroto(data.current, vnode.component.path, data.expr, '$modelSelect');
                } else if (params && 'change' in params) {
                    //TODO: array change
                } else {
                    console.warn('options update');
                    for (const option of vnode.node.getNode().options) {
                        let value = option.value;
                        if (data.numeric) value = parseFloat(value);
                        if (data.current.includes(value)) option.selected = true;
                        else option.selected = false;
                    }
                }
            }
        }
        return data.innerMounted;
    }

    static text(vnode) {
        const data = vnode.data.model;
        data.method = 'input';
        data.handler = event => {
            let value = event.target.value;
            if (data.numeric) {
                //Случается, когда числовой тип и ставится "-"
                if (!value && event.data) return;
                if (event.data == '.') return;
            }
            // TODO: не сработает момент, если указали свойство вложенного объекта
            vnode.getVars()[data.expr] = value;
        }
        return () => {
            //Если числовой и NaN, то игнорируем изменение, нужно, если ставят точку или тире
            if (data.numeric && isNaN(data.current)) return;
            vnode.node.prop('value', data.current);
        }
    }

}

export default Model