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
        switch (typeof value) {
            case 'number':
                if (isNaN(value)) value = '';
            case 'string': break;
            default:
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