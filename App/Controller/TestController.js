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

    addUser() {
        this.users.push({id: 7, name: 'Jessica'});
    }

    changeUser(index) {
        //this.users[index] = {id: -1, name: 'Mary'};
        this.users[index].name = 'Mary';
        this.userIndex = 99;
        console.log(this);
    }

    removeUser(index) {
        console.log('----- click delete user');
        console.log(index, this.users);
        this.users.splice(index, 1);
    }

    replaceUser(index) {
        this.users.splice(index, 2, {id: 8, name: 'Sam'});
    }

}

export default TestController