//DOM
export { default as DOM } from './Services/DOM/DOM.js'
export { default as Block } from './Services/DOM/Block.js'
export { default as NodeElement } from './Services/DOM/NodeElement.js'
//Reactive
export { default as Reactive } from './Services/Reactive/Reactive.js'
export { default as Parser } from './Services/Reactive/Parser.js'
//Request
export { default as Request } from './Services/Request/Request.js'
//Log
export { default as Log } from './Services/Log/Log.js'

export class Service {
    
    static load(moduleName) {
        // TODO: загрузка модуля
    }

}