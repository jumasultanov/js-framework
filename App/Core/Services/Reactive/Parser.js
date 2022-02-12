import { ParserConfig } from '../../../config.js';
import Directive from '../../Directive.js'
import Component from '../../Component.js'
import { Block, VDOM, VNode } from '../../Service.js';

class Parser {

    static TYPE_ATTR = 0;
    static TYPE_CONSTR = 1;
    static TYPE_EVENT = 2;
    static TYPE_UNKNOWN = 3;

    node;
    vdom;
    component;
    constrCount = 0;

    constructor(node, component) {
        this.node = node;
        this.component = component;
        this.vdom = new VDOM();
    }

    /**
     * Возвращает объект VDOM со списком VNode после парсинга
     * @returns {VDOM}
     */
    getVDOM() {
        return this.vdom;
    }

    /**
     * Старт парсинга
     * @returns {Parser}
     */
    build() {
        this.walk(this.node);
        return this;
    }

    /**
     * Прохождение по элементам блока и сбор результата парсинга в объект VDOM
     * @param {Node} node 
     * @param {boolean} include Будет ли парситься переданный элемент
     */
    walk(node, include = true) {
        Block.find(node, include, false, current => {
            if (current.nodeType == Node.ELEMENT_NODE) {
                //Если это блок-компонент
                if (current.hasAttribute(ParserConfig.componentAttr)) {
                    if (Component.create(current, this.component)) return false;
                }
            }
            let data = this.parse(current);
            if (data === false) return false;
            //Если есть данные с парсинга
            if (data) {
                //Добавляем
                this.vdom.add(data.nodes);
                //Если есть замена или тот же элемент или переместились на другой элемент
                if (data.breakpoint !== current) return data.breakpoint;
            }
            return true;
        });
    }

    /**
     * Возвращает данные парсинга Node элемента
     * @param {Node} node
     * @returns {object|null|false} Данные, если найдены директивы, либо null - ничего не найдено, либо false - если элемент нельзя трогать
     */
    parse(node) {
        //Если текст
        if (node.nodeType == Node.TEXT_NODE) return this.parseText(node);
        //Если элемент
        if (node.nodeType == Node.ELEMENT_NODE) return this.parseNode(node);
        return false;
    }
    
    /**
     * Парсим элемент и возвращаем данные по его конструкции и выражениям
     * @param {Node} node 
     * @returns {{ nodes: VNode[], breakpoint: Node } | null}
     */
    parseNode(node) {
        if (!(node instanceof Node)) return null;
        let result = VNode.getEmptyData();
        let rmv = [];
        let breakpoint = node;
        let constr = false;
        //Перебор атрибутов
        cycleAttrs:
        for (const {name, value} of node.attributes) {
            const data = Parser.getTypeAttr(name);
            switch (data.type) {
                //Атрибуты
                case Parser.TYPE_ATTR:
                    Directive.onName('basic', 'onParse', node, data.label, value, result);
                    break;
                //Конструкции
                case Parser.TYPE_CONSTR:
                    constr = { value, label: data.label };
                    rmv = [name];
                    break cycleAttrs;
                //События
                case Parser.TYPE_EVENT:
                    Directive.onName('basic', 'onParseEvent', data.label, value, result);
                    break;
                default:
                    continue;
            }
            rmv.push(name);
        }
        if (!rmv.length) return null;
        //Удаляем атрибуты
        for (const name of rmv) node.removeAttribute(name);
        //Выполняем разбор конструкции
        if (constr) {
            //Обновляем объект, т.к. конструкция не может иметь доп. функционала
            result = { constr: {} };
            this.setConstructions(node, constr.label, constr.value, result);
            //Указываем элемент замененного блока, откуда продолжится парсинг
            breakpoint = result.space;
        }
        // Возвращаем VNode[] и элемент, с которого продолжится парсинг
        return { nodes: [new VNode(node, this.component, result)], breakpoint };
    }

    /**
     * Разбираем атрибут элемента на конструкцию
     * @param {Node} node Элемент
     * @param {string} attr Название атрибута
     * @param {string} value Значение атрибута
     * @param {object} save Объект для хранения изменении
     */
    setConstructions(node, construction, value, save) {
        //Формируем базовые данные для всех конструкции
        save.constr[construction] = {};
        const obj = save.constr[construction];
        //Название компонента
        const componentName = `${ParserConfig.prefixCCName}:${this.getConstrCount()}`;
        // Директива должна возвращать объект из:
        // @param {string} expr             выражение, если изменилось
        // @param {object} list             список блоков-компонентов
        // @param {string|null} next        следующий блок конструкции, если нужно
        // @param {boolean} readyComponent  cразу ли запускать компонент
        let { expr, list, next, readyComponent } = Directive.onName(construction, 'onParse', value, node, obj, this);
        if (expr === undefined) return;
        //Сохраняем связанные конструкции
        if (next) obj.next = next;
        Object.assign(save.constr, list);
        //Сохарняем выражение здесь, конструкция могла ее изменить
        obj.expr = expr;
        //Заменяем на пустой коммент
        save.space = Block.replaceOnComment(node);
        //Записываем имя конструкции
        save.constrName = construction;
        //Создаем компонент
        obj.component = Component.createEmpty(node, componentName, this.component.getPath(), readyComponent);
    }

    /**
     * Поиск и парсинг соседних элементов конструкции
     * @param {Node} node Рассматриваемый элемент
     * @param {string[]} constructions Искомые конструкции
     * @param {object} list Список конструкции, объект, куда добавится
     * @returns {string|null} Название следующей конструкции
     */
    unionNodes(node, constructions, list) {
        if (!(node instanceof Node)) return null;
        if (node.nodeType != Node.ELEMENT_NODE) return null;
        for (const name of constructions) {
            const attr = ParserConfig.prefixConstr + name;
            if (!node.hasAttribute(attr)) continue;
            //Указываем имена для связки
            const number = this.getConstrCount();
            const uniqueName = `${name}-${number}`;
            const componentName = `${ParserConfig.prefixCCName}:${number}`;
            //Сразу проверяем следующий элмент
            const next = this.unionNodes(node.nextElementSibling, constructions, list);
            //Готовим элемент к транспортировке
            node.parentNode.removeChild(node);
            const expr = node.getAttribute(attr);
            node.removeAttribute(attr);
            list[uniqueName] = {
                next, name, expr,
                component: Component.createEmpty(node, componentName, this.component.getPath())
            };
            return uniqueName;
        }
        return null;
    }
    
    /**
     * Парсим тектовый элемент
     * @param {Node} node 
     * @returns false | { nodes: VNode[], breakpoint: Node }
     */
    parseText(node) {
        if (!(node instanceof Node)) return false;
        const result = Directive.onName('basic', 'onParseText', node, ParserConfig.exprInText);
        if (!result) return false;
        let newNodes = [];
        for (const item of result.items) newNodes.push(new VNode(item.text, this.component, item.data));
        return { nodes: newNodes, breakpoint: result.lastElement };
    }

    /**
     * Счетчик для динамических компонентов, которые управляются условиями
     * @returns {number}
     */
    getConstrCount() {
        this.constrCount++;
        return this.constrCount;
    }
    
    /**
     * Возвращает список компонентов после парсинга
     * @param {Element} element Элемент парсинга
     * @param {boolean} include Включен ли элемент в парсинг
     * @return {object}
     */
    static start(element, include = true) {
        let result = {};
        Block.find(element, include, true, current => {
            if (current.hasAttribute(ParserConfig.componentAttr)) {
                const component = Component.create(current);
                if (component) {
                    result[component.name] = component;
                    return false;
                }
            }
            return true;
        });
        return result;
    }

    /**
     * Возвращает тип и название атрибута без префикса
     * @param {string} attr Атрибут
     * @returns {object}
     */
    static getTypeAttr(attr) {
        let type = this.TYPE_UNKNOWN;
        let index = 0;
        //Если атрибут
        if (attr.startsWith(ParserConfig.prefixAttr)) {
            type = this.TYPE_ATTR;
            index = ParserConfig.prefixAttr.length;
            //Если конструкция
        } else if (attr.startsWith(ParserConfig.prefixConstr)) {
            type = this.TYPE_CONSTR;
            index = ParserConfig.prefixConstr.length;
            //Если событие
        } else if (attr.startsWith(ParserConfig.prefixEvent)) {
            type = this.TYPE_EVENT;
            index = ParserConfig.prefixEvent.length;
        }
        return { type, label: attr.substring(index) };
    }
    
}

export default Parser