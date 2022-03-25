let vars = {
    a: 1,
    b: 2
};
let p = new Proxy({
    c: 3,
    d: 4
}, {
    set(target, prop, val, receiver) {
        if (prop == '__proto__') return Reflect.set(target, prop, val, receiver);
        console.log(prop, target);
        if (target.hasOwnProperty([prop])) {
            // 
            return Reflect.set(target, prop, val, receiver);
        } else {
            return Reflect.set(target.__proto__, prop, val);
            //target.__proto__[prop] = val;
        }
        return true;
        //Выполняем изменение значения
        let result = Reflect.set(target, prop, val, receiver);
        return result;
    }
});
let x = new Proxy({
    e: 5,
    f: 6
}, {
    set(target, prop, val, receiver) {
        if (prop == '__proto__') return Reflect.set(target, prop, val, receiver);
        console.log(prop, target);
        if (target.hasOwnProperty([prop])) {
            // 
            return Reflect.set(target, prop, val, receiver);
        } else {
            return Reflect.set(target.__proto__, prop, val);
            //target.__proto__[prop] = val;
        }
        return true;
        //Выполняем изменение значения
        let result = Reflect.set(target, prop, val, receiver);
        return result;
    }
})
p.__proto__ = vars;
x.__proto__ = p;