import { AppConfig } from '../../../config.js';
import VDOM from './VDOM.js'
import VNode from './VNode.js'

class Parser {
    
    //Регулярка для поиска шаблона в тексте
    static findExpressions = /{{[^}]*}}/g; // RegEXP /\{\{((?:.|\r?\n)+?)\}\}/g -> for VueJS

    node;
    vdom;

    constructor(node) {
        this.node = node;
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
     * @param {null|VNode} parent Родитель в структуре
     * @param {boolean} include Будет ли парситься переданный элемент
     */
    walk(node, parent = null, include = true) {
        // TODO: Если шаблон TEMPLATE или
        // спец. блоки с атрибутом m-dynamic (если они вообще нужны, надо подумать про SEO)
        // то надо спарсить, но не запускать реактивность
        /*if (!child && node.tagName == 'TEMPLATE') {
            //Ignore exclusive templates
            if (node.hasAttribute('dynamic')) return;
            child = node.content.firstChild;
        }*/

        if (node.nodeType != Node.ELEMENT_NODE) return;
        //Определяем первый элемент парсинга
        let child = node.firstChild;
        if (include) child = node;
        while (child) {
            let data = this.parse(child, include);
            if (data !== false) {
                //Если есть данные с парсинга
                if (data) {
                    //Если есть замена или тот же элемент
                    child = data.breakpoint;
                    //Добавляем в структуру
                    if (parent) parent.addChildren(data.nodes, this.vdom);
                    else this.vdom.add(data.nodes);
                }
                //Проходимся по дочерним элементам
                this.walk(child, parent, false);
            }
            if (include) break;
            child = child.nextSibling;
        }
    }

    /**
     * Возвращает данные парсинга Node элемента
     * @param {Node} node 
     * @param {boolean} ignoreSkip Игнориуются проверки
     * @returns {object|null|false} Данные, если найдены директивы, либо null - ничего не найдено, либо false - если элемент нельзя трогать
     */
    parse(node, ignoreCheck = false) {
        //Если текст
        if (node.nodeType == Node.TEXT_NODE) return Parser.parseText(node);
        //Если элемент
        if (node.nodeType == Node.ELEMENT_NODE) {
            //Игнорируем блоки-компоненты
            if (!ignoreCheck && node.getAttribute(AppConfig.componentAttr) !== null) return false;
            //Получаем данные
            let data = Parser.parseNode(node);
            if (data) {
                //Если есть вложенные конструкции
                if (data.internals.length) {
                    data.internals.forEach(item => {
                        let internalParent = data.nodes[0];
                        let internalNode = item;
                        if (item instanceof VNode) {
                            internalParent = item;
                            internalNode = item.node;
                        }
                        this.walk(internalNode, internalParent, false);
                    });
                }
            }
            return data;
        }
        return false;
    }

    /**
     * Парсим блок элемента
     * @param {Node} node 
     * @returns {Parser}
     */
    static build(node) {
        const self = new this(node);
        self.build();
        return self;
    }
    
    /**
     * Парсим элемент и возвращаем данные по его конструкции и выражениям
     * @param {Node} node 
     * @returns {{ nodes: VNode[], breakpoint: Node, internals: VNode[]|Node[] } | null}
     */
    static parseNode(node) {
        if (!(node instanceof Node)) return null;
        let result = VNode.getEmptyData();
        let rmv = [];
        let breakpoint = node;
        let internals = [];
        let isSpace = false;
        let isTemplate = node.tagName == 'TEMPLATE';
        let insertTemplate = [];
        let tempVNodeIndex;
        //Перебор атрибутов
        for (const {name, value} of node.attributes) {
            if (name == AppConfig.componentAttr) continue;
            let f, $name;
            if (name.startsWith('m-')) f = '#';
            else f = name.substr(0, 1);
            //Event
            switch (f) {
                case '@':
                    if (isTemplate) break;
                    $name = name.substr(1);
                    result.on[$name] = {expr: value/*, mods: []*/};
                    break;
                case ':':
                    if (isTemplate) break;
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
                case '#':
                    let exp = name.substr(2);
                    result.constr[exp] = { expr: value };
                    switch (exp) {
                        //Активные выражения, которые заменяются на коммент
                        case 'if':
                        case 'else-if':
                            if (!isSpace) {
                                //Состояние условия false
                                result.constr[exp].current = false;
                                result.constr[exp].changed = false;
                                //Если след. элемент часть конструкции
                                const next = this.parseNode(node.nextElementSibling);
                                if (next) {
                                    result.constr[exp].next = next.nodes[0];
                                    internals.push(next.nodes[0]);
                                }
                            }
                        case 'else':
                        case 'for':
                        // TODO: add more expressions
                        // on example: switch
                            if (isSpace) {
                                delete result.constr[exp];
                                insertTemplate.push({ name, value });
                            } else isSpace = true;
                            internals.push(node);
                            break;
                        //Пассивные выражения, которые могут измениться позже
                        /*case 'dynamic':
                            let template = document.querySelector(`template[${exp}="${value}"]`);
                            if (template) {
                                let tempVNode = new VNode(template.content, VNode.getEmptyData());
                                result.constr[exp].vnode = tempVNode;
                                tempVNodeIndex = internals.length;
                                internals.push(tempVNode);
                            }
                            break;*/
                    }
                    break;
                default:
                    continue;
            }
            rmv.push(name);
        }
        //Если нужно заменить на коммент,
        // делается одноразово, дальше формируется глубже template
        if (isSpace) {
            let space = new Comment();
            node.parentNode.replaceChild(space, node);
            breakpoint = space;
            result.space = space;
        }
        if (!isSpace && !rmv.length) return null;
        for (const name of rmv) node.removeAttribute(name);
        let currentNode = isTemplate ? node.content : node;
        //insertTemplate
        if (isSpace) {
            //Если есть активное выражение и выражение dynamic, то убираем в подшаблон
            if (result.constr.dynamic) {
                insertTemplate.push({ name: 'c-dynamic', value: result.constr.dynamic.expr });
                delete result.constr.dynamic;
                internals.splice(tempVNodeIndex, 1);
            }
            this.insertTemplates(insertTemplate, currentNode);
        }
        // return nodes and other actions
        return {nodes: [new VNode(currentNode, result)], breakpoint, internals };
    }
    
    /**
     * Парсим тектовый элемент
     * @param {Node} node 
     * @returns false | { nodes: VNode[], breakpoint: Node }
     */
     static parseText(node) {
        if (!(node instanceof Node)) return false;
        let newNodes = [];
        let split = [];
        let end = false;
        let str = node.textContent;
        for (const match of str.matchAll(this.findExpressions)) {
            //Pre text
            if (split.length == 0 && match.index > 0) split.push(new Text(match.input.substring(0, match.index)));
            //Between text after prev
            if (end && match.index > end) split.push(new Text(match.input.substring(end, match.index)));
            //Set end index
            end = match.index + match[0].length;
            //Add expression
            let text = new Text(match.input.substring(match.index, end));
            let value = text.textContent.substr(2, match[0].length - 4);
            newNodes.push(new VNode(text, {expr: value}));
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
    * Добавляем в элемент конструкции, увеличивая глубину узлов
    * @param {object[]} inserts Вставляемые конструкции
    * @param {Node} node  
    */
   static insertTemplates(inserts, node) {
       if (!inserts.length) return;
       let tree, last;
       inserts.forEach(insert => {
           let template = document.createElement('template');
           template.setAttribute(insert.name, insert.value);
           if (last) tree.content.appendChild(template);
           else tree = template;
           last = template;
       });
       node.childNodes.forEach(child => tree.content.appendChild(child));
       node.appendChild(tree);
   }

}

export default Parser