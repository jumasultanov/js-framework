import Controller from '../Core/Controller.js';

/**
 * Контроллер для блоков
 * 
 *      Event life cycle
 *          constructor
 *          created
 *          mounted
 *          updated
 *          beforeDestroy
 *          destroyed
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
    customVar2 = 10;
    customVar3 = 888;
    big = {
        items: ['a', 'b', 'c'],
        _items: [
            {id: 1, name: 'a'},
            {id: 2, name: 'b'},
            {id: 3, name: 'c'},
        ],
        elements: {
            a: {id: 1},
            b: {id: 2},
            c: {id: 3},
        },
        current: 1,
        callback() {
            console.log(this);
        }
    }

    //Срабатывает перед слиянием с компонентом beforeCreateComponent
    //  Контекст {this} - текущий объект контроллера
    constructor() {
        super();
        console.log('START TestController', this);
    }

    //Срабатывает после связки с компонентом
    //  Контекст {this} - объект данных с текущими свойствами и методами и с компонентом
    created() {
        console.log('Created', this);
    }

    //Срабатывает после включения компонента
    mounted() {
        console.log('Mounted', this);
        //this.customVar3 = 1000;
    }

    //Срабатывает после обновления данных компонента и внесения его в DOM
    updated() {
        console.log('Updated', this);
    }

    //Срабатывает перед уничтожением компонента
    beforeDestroy() {
        console.log('Before destroy');
    }

    //Срабатывает после уничтожения компонента
    destroyed() {
        console.log('Destroyed');
    }

    //Срабатывает после изменения свойства "customVar3"
    watchCustomVar3(value, old) {
        console.log('Change CustomVar3');
        console.log(value, old);
        console.log(this);
        this.customVar2 += 10;
    }

    watchCounter(value, old) {
        console.log('Change counter');
        console.log(value, old);
        console.log(this);
    }

    click(ev) {
        this.customVar3 -= 8;
        this.counter += 10;
    }
}

export default TestController