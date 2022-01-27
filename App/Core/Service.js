//DOM
export { default as DOM } from './Services/DOM/DOM.js'
export { default as Block } from './Services/DOM/Block.js'
export { default as NodeElement } from './Services/DOM/NodeElement.js'
//Reactive
export { default as LocalProxy } from './Services/Reactive/LocalProxy.js'
export { default as Parser } from './Services/Reactive/Parser.js'
export { default as VDOM } from './Services/Reactive/VDOM.js'
export { default as VNode } from './Services/Reactive/VNode.js'
//Request
export { default as Request } from './Services/Request/Request.js'
//Log
export { default as Log } from './Services/Log/Log.js'

export class Service {
    
    static load(moduleName) {
        // TODO: загрузка модуля
    }

}