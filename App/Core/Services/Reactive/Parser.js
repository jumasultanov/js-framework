import { AppConfig } from '../../../config.js';
import Component from '../../Component.js'
import { Block, VDOM, VNode } from '../../Service.js';

class Parser {
    
    //Регулярка для поиска шаблона в тексте
    static findExpressions = /{{[^}]*}}/g; // RegEXP /\{\{((?:.|\r?\n)+?)\}\}/g -> for VueJS

    node;
    vdom;
    component;

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
            if (current.hasAttribute(AppConfig.componentAttr)) {
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
                if (current.hasAttribute(AppConfig.componentAttr)) {
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
        //let isTemplate = node.tagName == 'TEMPLATE';
        let construction;
        //Перебор атрибутов
        cycleAttrs:
        for (const {name, value} of node.attributes) {
            if (name == AppConfig.componentAttr) continue;
            let f, $name;
            if (name.startsWith('m-')) f = '#';
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
                /*case '#':
                    construction = name.substr(2);
                    result.constr[construction] = { expr: value };
                    const obj = result.constr[construction];
                    switch (construction) {
                        //Активные выражения, которые заменяются на коммент
                        case 'if':
                            let list = {};
                            const next = this.unionNodes(node.nextElementSibling, ['m-else-if', 'm-else'], list);
                            obj.next = next;
                            Object.assign(result.constr, list);
                        //case 'for':
                            //
                            //break;
                    }
                    node.removeAttribute(name);
                    //Заменяем на пустой коммент
                    result.space = this.replaceBlock(node);
                    //Создаем компонент
                    obj.component = this.createComponent(node);
                    breakpoint = result.space;
                    rmv = [];
                    break cycleAttrs;*/
                default:
                    continue;
            }
            rmv.push(name);
        }
        if (!construction && !rmv.length) return null;
        //Удаляем атрибуты
        for (const name of rmv) node.removeAttribute(name);
        // Возвращаем VNode[] и элемент, с которого продолжится парсинг
        return {nodes: [new VNode(node, this.component, result)], breakpoint };
    }

    /**
     * Поиск и парсинг соседних элементов конструкции
     * @param {Node} node Рассматриваемый элемент
     * @param {string[]} attrs Искомые атрибуты
     * @param {object} list Список конструкции
     * @returns {string|null} Название следующей конструкции
     */
    unionNodes(node, attrs, list) {
        if (!(node instanceof Node)) return null;
        if (node.nodeType != Node.ELEMENT_NODE) return null;
        for (const attr of attrs) {
            if (!node.hasAttribute(attr)) continue;
            //Сразу проверяем следующий элмент
            const next = this.unionNodes(node.nextElementSibling, attrs, list);
            //Готовим элемент к транспортировке
            node.parentNode.removeChild(node);
            const expr = node.getAttribute(attr);
            node.removeAttribute(attr);
            //Указываем имя для связки
            const name = attr.substr(2);
            const uniqueName = name + '-' + Object.keys(list).length;
            list[uniqueName] = {
                next, name, expr,
                component: this.createComponent(node)
            };
            return uniqueName;
        }
        return null;
    }

    /**
     * Создание компонента для элемента
     * @param {Node} node 
     * @returns {Component}
     */
    createComponent(node) {
        const component = new Component({ element: node, name: '#' });
        component.build();
        component.display(false);
        return component;
    }

    /**
     * Заменяет элемент HTML-комментарием и возвращает его
     * @param {Node} node 
     * @returns {Comment}
     */
    replaceBlock(node) {
        const space = new Comment();
        node.parentNode.replaceChild(space, node);
        return space;
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
        for (const match of str.matchAll(Parser.findExpressions)) {
            //Pre text
            if (split.length == 0 && match.index > 0) split.push(new Text(match.input.substring(0, match.index)));
            //Between text after prev
            if (end && match.index > end) split.push(new Text(match.input.substring(end, match.index)));
            //Set end index
            end = match.index + match[0].length;
            //Add expression
            let text = new Text(match.input.substring(match.index, end));
            let value = text.textContent.substr(2, match[0].length - 4);
            newNodes.push(new VNode(text, this.component, {expr: value}));
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
    
}

export default Parser