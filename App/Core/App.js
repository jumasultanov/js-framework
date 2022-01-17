import Component from "./Component.js";
import Area from "./Area.js";

class App {

    /**
     * Инициализация
     */
    static init(parentElement) {
        Area.parseGlobals();
        Component.update(parentElement);
    }

}

export default App