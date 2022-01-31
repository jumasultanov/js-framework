import Controller from '../Core/Controller.js';

/**
 * Контроллер для блоков
 * 
 *      Event life cycle
 *          mounted
 *          unMounted
 * 
 *      Custom methods
 *          ---
 * 
 *      Watchers
 *          watchCustomVar1
 * 
 */

class TestController2 extends Controller {

    name = 'test';
    text = 'asdsadsd';
    desc = 'TETETETE';

    constructor() {
        super();
        console.log('START TestController 2');
    }

    doubleClick() {
        console.log('Double click', this);
    }

    watchName(value, old) {
        console.log('Change Name');
        console.log(value, old);
    }

}

export default TestController2