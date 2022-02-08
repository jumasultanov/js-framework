let a = [50,3,9,15];
let pos = null;
let b = new Proxy(a, {
    get(t,p) {
        console.log('GET', p);
        if (!isNaN(Number(p))) {
            pos = p;
        }
        return Reflect.get(t,p)
    },
    set(t,p,v) {
        console.log('SET', p, v);
        if (!isNaN(Number(p))) {
            console.warn('Move', pos + ' -> ' + p, v);
            if (!(p in t)) {
                console.log('PUSH');
            } else {
                if (pos === null || pos === p || t[pos] !== v) {
                    console.log('PASTE NEW');
                } else {
                    console.log('MOVE');
                }
            }
        }
        pos = null;
        return Reflect.set(t,p,v);
    },
    deleteProperty(t,p) {
        console.log('DELETE', p);
        return Reflect.deleteProperty(t,p);
    }
});
b.sort((a,b) => a - b);