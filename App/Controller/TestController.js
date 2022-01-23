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

class TestController extends Controller {

    customVar1 = true;
    customVar2 = false;
    customVar3 = 888;

    constructor() {
        super();
        console.log('START TestController');
    }

    click(ev) {
        console.log(ev);
        console.log('Click', this);
        //this.counter += 10;
        this.customVar3 -= 8;
    }

    mounted() {
        console.log('Mounted');
    }
    
    unmounted() {
        console.log('UnMounted');
    }

    watchCustomVar1(value, old) {
        console.log('Change CustomVar1');
        console.log(value, old);
    }

}

export default TestController