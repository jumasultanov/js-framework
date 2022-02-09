import Directive from "./Directive.js";
import Component from "./Component.js";
import Area from "./Area.js";

class App {

    /**
     * Инициализация
     */
    static init(parentElement) {
        Directive.boot();
        Area.parseGlobals();
        Component.init(parentElement);
    }

}

export default App