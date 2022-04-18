class Transform {
    
    /**
     * 
     * @param {any} data 
     * @param {URL} url 
     */
    static asURL(data, url) {
        if (typeof data == 'string') return url.search = data;
        if (data instanceof Object && data.constructor.name == 'Object') return this.collect(data, url.searchParams);
    }

    /**
     * 
     * @param {any} data 
     * @returns {any}
     */
    static asBody(data, formData = new FormData()) {
        this.collect(data, formData);
        return formData;
    }

    /**
     * 
     * @param {object} data 
     * @param {URLSearchParams|FormData} collection
     * @param {string} prefix
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