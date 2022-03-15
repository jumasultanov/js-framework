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

    doubleClick() {
        console.log('Double click', this);
    }
    
    click() {
        console.log('Click 2', this);
        this.name += '!';
        this.checked = !this.checked;
        this.counter++;
        this.customVar2 += 10;
    }

    watchName(value, old) {
        console.log('Change Name');
        console.log(value, old);
    }

}

export default TestController2