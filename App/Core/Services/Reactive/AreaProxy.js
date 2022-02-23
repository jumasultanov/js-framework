import { LocalProxy, AreaExpanding, Dependency } from '../../Service.js';

class AreaProxy {
    
    /**
     * Возвращает прокси для объекта
     * @param {object} vars Проксируемый объект
     * @returns {object}
     */
    static on(vars) {
        //Проксируем основной объект и возвращаем оба варианта
        const proxy = new Proxy(vars, LocalProxy);
        //Добавляем скрытый метод добавления свойства и получения оригинального объекта для свойства
        AreaExpanding.setCreate(vars);
        AreaExpanding.setOrigin(vars);
        //Проксируем вложенные объекты
        this.onInternal(vars);
        return { proxy, vars };
    }

    /**
     * Преобразует объекты в прокси с дочерними объектами
     * @param {object} vars Проксируемый объект
     */
    static onInternal(vars) {
        if (!(vars instanceof Object)) return;
        for (const key in vars) this.one(vars, key);
    }

    /**
     * Преобразует объект и дочерние объекты в прокси 
     * @param {object} vars 
     * @param {string} key 
     */
    static one(vars, key) {
        if (vars[key] instanceof Object && typeof vars[key] == 'object') {
            const item = vars[key];
            //Если объект уже спроксирован, то не трогаем его и не проходимся по вложенным объектам
            if ('isProxy' in item) return;
            //Проксируем сначала дочерние
            this.onInternal(item);
            //Добавляем скрытые предустановочные свойства
            item.__proto__ = AreaExpanding.getRoot(item);
            Dependency.define(item, false);
            vars[key] = new Proxy(item, LocalProxy);
        }
    }

}

export default AreaProxy