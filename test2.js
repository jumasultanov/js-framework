let a = {a:1,b:2,c:3};
let pos = null;
let b = new Proxy(a, {
    get(t,p) {
        console.log('GET', p);
        return Reflect.get(t,p)
    },
    set(t,p,v) {
        console.log('SET', p, v);
        return Reflect.set(t,p,v);
    },
    deleteProperty(t,p) {
        console.log('DELETE', p);
        return Reflect.deleteProperty(t,p);
    }
});
b.a = 99;