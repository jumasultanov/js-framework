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
        //console.log('START TestController');
    }

    click(ev) {
        //console.log(ev);
        //console.log('Click', this);
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
        //console.log(this);
    }

    removeUser(index) {
        //console.log('----- click delete user');
        console.log(index, this.users);
        this.users.splice(index, 1);
    }

    replaceUser(index) {
        this.users.splice(index, 2, {id: 8, name: 'Sam'});
    }

    clear() {
        console.clear();
    }

    up() {
        const table = document.getElementById('debug');
        table.innerHTML = '<tr><td>Area</td><td>Component children</td><td>Inserted</td></tr>';
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        const td2 = document.createElement('td');
        const td3 = document.createElement('td');
        const varName = 'users';
        for (let i in globals.content[varName]) {
            const item = globals.content[varName][i];
            if (!i.startsWith('#construction:1:')) continue;
            let cell = document.createElement('span');
            cell.innerHTML = `<b>${i}</b></br> index: ${item.vars.userIndex}; id: ${item.vars.user.id}; name: ${item.vars.user.name} <br>`;
            //cell.innerHTML = `<b>${i}</b></br> id: ${item.vars.country.id}; name: ${item.vars.country.ru} <br>`;
            td1.appendChild(cell);
        }
        for (let i in test.content.children[varName].children) {
            const item = test.content.children[varName].children[i];
            if (!i.startsWith('#construction:1:')) continue;
            let cell = document.createElement('span');
            cell.innerHTML = `<b>${item.name}</b></br> index: ${item.vars.userIndex}; id: ${item.vars.user.id}; name: ${item.vars.user.name} <br>`;
            //cell.innerHTML = `<b>${item.name}</b></br> id: ${item.vars.country.id}; name: ${item.vars.country.ru} <br>`;
            td2.appendChild(cell);
        }
        test.content.children[varName].vdom.items.forEach(vnode => {
            vnode.data.inserted.forEach(item => {
                if (!item.name.startsWith('#construction:1:')) return;
                let cell = document.createElement('span');
                cell.innerHTML = `<b>${item.name}</b></br> index: ${item.vars.userIndex}; id: ${item.vars.user.id}; name: ${item.vars.user.name} <br>`;
                //cell.innerHTML = `<b>${item.name}</b></br> id: ${item.vars.country.id}; name: ${item.vars.country.ru} <br>`;
                td3.appendChild(cell);
            });
        })
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        table.appendChild(tr);
        console.table(globals.content.vars.countries);
    }
}

export default TestController