class Transform {
    
    /**
     * Преобразование и добавление данных в объект URL
     * @param {any} data 
     * @param {URL} url 
     */
    static asURL(data, url) {
        if (typeof data == 'string') return url.search = data;
        if (data instanceof Object && data.constructor.name == 'Object') return this.collect(data, url.searchParams);
    }

    /**
     * Преобразование и добавление данных в объект FormData
     * @param {any} data 
     * @param {FormData} formData 
     * @returns {any}
     */
    static asBody(data, formData = new FormData()) {
        this.collect(data, formData);
        return formData;
    }

    /**
     * Преобразование данных в объект "collection"
     * @param {object} data Данные
     * @param {URLSearchParams|FormData} collection Контейнер
     * @param {string} prefix Префикс для названии ключей
     */
    static collect(data, collection, prefix = null) {
        if (
            data instanceof Object &&
            ( data.constructor.name == 'Object' || data.constructor.name == 'Array' )
        ) {
            for (let key of Object.keys(data)) {
                this.collect(data[key], collection, prefix ? prefix + `[${key}]` : key);
            }
        } else {
            if (data === undefined) return;
            collection.set(prefix, data);
        }
    }

}

export default Transform