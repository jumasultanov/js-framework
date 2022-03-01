class Transform {

    /**
     * Преобразование в логическое значение
     * @param {any} value Значение
     * @returns {boolean}
     */
    static bool(value) {
        return !!value;
    }

    /**
     * Преобразование значения в текст
     * @param {any} value Значение
     * @returns {string}
     */
    static text(value) {
        if (typeof value != 'string' && typeof value != 'number') {
            if (value) {
                if (value instanceof Object) value = JSON.stringify(value);
                else value = String(value);
            } else value = '';
        }
        return value;
    }

    static kebabToCamel(str) {
        // TODO: 
    }

    static camelToKebab(str) {
        // TODO: 
    }

}

export default Transform