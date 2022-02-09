import { ParserConfig } from '../../../config.js';
import Directive from '../../Directive.js'
import Component from '../../Component.js'
import { Block, VDOM, VNode } from '../../Service.js';

class Parser {

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
        let isConstr = false;
        //Перебор атрибутов
        cycleAttrs:
        for (const {name, value} of node.attributes) {
            let f, $name;
            if (name.startsWith(ParserConfig.prefixConstr)) f = '#';
            else f = name.substr(0, 1);
            //Event
            switch (f) {
                //События
                case '@':
                    //if (isTemplate) break;
                    $name = name.substr(1);
                    result.on[$name] = {expr: value/*, mods: []*/};
                    break;
                //Атрибуты
                case ':':
                    //if (isTemplate) break;
                    $name = name.substr(1);
                    if ($name == 'style') {
                        // TODO: parse style json for object
                        result.style = value;
                    } else if ($name == 'class') {
                        // TODO: parse class json for object
                        result.class = value;
                    } else if ($name in node) result.props[$name] = value;
                    else result.attrs[$name] = { expr: value };
                    break;
                //Конструкции
                case '#':
                    isConstr = true;
                    //Выполняем разбор
                    this.setConstructions(node, name, value, result);
                    //Указываем элемент замененного блока, откуда продолжится парсинг
                    breakpoint = result.space;
                    rmv = [];
                    break cycleAttrs;
                default:
                    continue;
            }
            rmv.push(name);
        }
        if (!isConstr && !rmv.length) return null;
        //Удаляем атрибуты
        for (const name of rmv) node.removeAttribute(name);
        // Возвращаем VNode[] и элемент, с которого продолжится парсинг
        return {nodes: [new VNode(node, this.component, result)], breakpoint };
    }

    /**
     * Разбираем атрибут элемента на конструкцию
     * @param {Node} node Элемент
     * @param {string} attr Название атрибута
     * @param {string} value Значение атрибута
     * @param {object} save Объект для хранения изменении
     */
    setConstructions(node, attr, value, save) {
        //Формируем базовые данные для всех конструкции
        const construction = attr.substring(ParserConfig.prefixConstr.length);
        save.constr[construction] = {};
        const obj = save.constr[construction];
        //Название компонента
        const componentName = `${ParserConfig.prefixCCName}:${this.getConstrCount()}`;
        //Получаем данные после обработки из директивы
        let { expr, list, next, readyComponent } = Directive.parse(construction, value, node, obj, this);
        if (expr === undefined) return;
        //Сохраняем связанные конструкции
        if (next) obj.next = next;
        Object.assign(save.constr, list);
        //Сохарняем выражение здесь, конструкция могла ее изменить
        obj.expr = expr;
        //Удаляем атрибут
        node.removeAttribute(attr);
        //Заменяем на пустой коммент
        save.space = Block.replaceOnComment(node);
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
        let newNodes = [];
        let split = [];
        let end = false;
        let str = node.textContent;
        for (const match of str.matchAll(ParserConfig.exprInText)) {
            //Pre text
            if (split.length == 0 && match.index > 0) split.push(new Text(match.input.substring(0, match.index)));
            //Between text after prev
            if (end && match.index > end) split.push(new Text(match.input.substring(end, match.index)));
            //Set end index
            end = match.index + match[0].length;
            //Add expression
            const text = new Text(match.input.substring(match.index, end));
            const value = text.textContent.substr(2, match[0].length - 4);
            const data = { expr: value, transform: Parser.transformText };
            newNodes.push(new VNode(text, this.component, data));
            split.push(text);
        }
        if (!split.length) return false;
        //Suffix text
        if (end !== false && end < str.length) split.push(new Text(str.substr(end)));
        //Insert cutting
        for (const text of split) node.parentNode.insertBefore(text, node);
        node.parentNode.removeChild(node);
        return {nodes: newNodes, breakpoint: split[split.length - 1]};
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
     * Преобразование значении в текст
     * @param {any} value Значение
     * @returns {string}
     */
    static transformText(value) {
        if (typeof value != 'string') {
            if (value) {
                if (value instanceof Object) value = JSON.stringify(value);
                else value = String(value);
            } else value = '';
        }
        return value;
    }
    
}

export default Parser