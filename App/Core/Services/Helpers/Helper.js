class Helper {

    /**
     * Возвращает объект - дескриптор
     */
    static getDescriptor(value, configurable = true, writable = true, enumerable = true) {
        return { value, configurable, writable, enumerable }
    }

    /**
     * Возвращает массив чисел, начиная от start
     * @param {number} start Начальное число
     * @param {number} length Кол-во чисел
     * @returns {number[]}
     */
    static range(start, length) {
        if (length < 1) return [];
        return [...(function* r(start, end) {
            yield start;
            if (start === end) return;
            yield* r(start + 1, end);
        })(start, start + length - 1)];
    }

    /**
     * Возвращает число, ограничивая минимальным и максимальным значением
     * @param {number} num 
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    static limit(num, min, max) {
        if (num < min) return min;
        if (num > max) return max;
        return num;
    }

}

export default Helper