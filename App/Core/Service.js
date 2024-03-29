//Helper
export { default as Helper } from './Services/Helpers/Helper.js';
export { default as StrParser } from './Services/Helpers/Parser.js';
export { default as Transform } from './Services/Helpers/Transform.js';
//DOM
export { default as DOM } from './Services/DOM/DOM.js'
export { default as Block } from './Services/DOM/Block.js'
export { default as NodeElement } from './Services/DOM/NodeElement.js'
//Reactive
export { default as LocalProxy } from './Services/Reactive/LocalProxy.js'
export { default as AreaProxy } from './Services/Reactive/AreaProxy.js'
export { default as AreaExpanding } from './Services/Reactive/AreaExpanding.js'
export { default as ObjectControl } from './Services/Reactive/ObjectControl.js'
export { default as Executor } from './Services/Reactive/Executor.js'
export { default as Dependency } from './Services/Reactive/Dependency.js'
export { default as Parser } from './Services/Reactive/Parser.js'
export { default as VDOM } from './Services/Reactive/VDOM.js'
export { default as VNode } from './Services/Reactive/VNode.js'
//Request
export { default as Request } from './Services/Request/Request.js'
//Server
export { default as Server } from './Services/Server/Server.js'
//Log
export { default as Log } from './Services/Log/Log.js'

export class Service {
    
    static load(moduleName) {
        // TODO: загрузка модуля
    }

}