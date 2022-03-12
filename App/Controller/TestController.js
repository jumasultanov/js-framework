import Controller from '../Core/Controller.js';

/**
 * Контроллер для блоков
 * 
 *      Properties (данные контроллера, которые будут совмещены с данными компонента, как и любые методы)
 * 
 *      Hooks life cycle (не обязательно использовать данные методы)
 *          constructor
 *          created
 *          mounted
 *          beforeUpdate
 *          updated
 *          beforeDestroy
 *          destroyed
 * 
 *      Custom methods (любые пользовательские методы)
 * 
 *      Watchers (наблюдатели, срабатывают, когда изменилось свойство, в аргументах принимают новое значение и старое значение)
 *          watchCustomVar1 (название метода заполняется по шаблону: "watch<Название свойства>" )
 *              * TODO: пока нельзя следить за свойствами вложенных объектов
 * 
 */

class TestController extends Controller {

    customVar1 = true;
    customVar2 = 10;
    customVar3 = 888;
    checked = false;
    classes = {
        abc: true,
        xyz: 1,
        't-t-t': 0
    }
    styles = {
        display: 'block',
        color: 'green',
        opacity: 0.2,
        'font-size': '18px',
        'font-weight': 'bold'
    }
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
            //Тут контекст это "big", т.е. к контроллеру не попасть
            console.log(this);
        }
    }
/*
    //Срабатывает перед слиянием с компонентом beforeCreateComponent
    //  Контекст {this} - текущий объект контроллера
    constructor() {
        super();
        console.log('START TestController');
    }

    //Срабатывает после связки с компонентом
    //  Контекст {this} - объект данных с текущими свойствами и методами и с компонентом
    created() {
        console.log('Created');
    }

    //Срабатывает после включения компонента
    mounted() {
        console.log('Mounted');
        //this.customVar3 = 1000;
    }
*/
    //Срабатывает перед обновлением данных компонента и перед внесением его в DOM
    beforeUpdate() {
        console.log('Before update');
    }

    //Срабатывает после обновления данных компонента и внесения его в DOM
    updated() {
        console.log('Updated');
    }
/*
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
    }*/
/*
    watchChecked(value, old) {
        console.log('Change checked');
        console.log(value, old);
        console.log(this);
    }*/

    click(ev) {
        //this.customVar3 -= 8;
        //this.counter += 10;
        console.log("CLICK");
        this.checked = !this.checked;
        
        this.classes.abc = !this.classes.abc;
        this.classes['t-t-t'] = !this.classes['t-t-t'];
        this.classes.WWW = !this.classes.WWW;
        delete this.classes.xyz;
        this.styles.opacity += 0.1;
        this.styles['font-size'] = (parseFloat(this.styles['font-size'])+1) + 'px';
        delete this.styles['font-weight'];
    }
}

export default TestController