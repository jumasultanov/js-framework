import Area from "../../Area.js";
import { AreaExpanding, Helper } from "../../Service.js";

class ObjectControl {

    //Константы изменения массива
    static ACTION_PUSH = 0;
    static ACTION_DELETE = 1;
    static ACTION_MOVE = 2;
    static ACTION_REVERSE = 3;
    static ACTION_SORT = 4;
    static ACTION_REPLACE = 5;
    //Методы массива для перехвата
    static methods = [ 'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse' ];
    //Объект из прототипа массива
    static arrayMethods = Object.create(Array.prototype);

    /**
     * Создаем методы перехвата для массивов
     */
    static createProto() {
        this.methods.forEach(method => {
            //Храним оригинальный метод для последующего вызова
            const original = Array.prototype[method];
            //Получаем метод перехватчик в текущем классе
            const func = this['on' + method[0].toUpperCase() + method.slice(1)];
            //Добавляем в объект метод перехватчик
            Object.defineProperty(this.arrayMethods, method,
                Helper.getDescriptor(function() {
                    //Собираем аргументы
                    let args = [];
                    let len = arguments.length;
                    let arrLen = this.length;
                    while (len--) args[len] = arguments[len];
                    //Пропускаем обновления
                    ObjectControl.skipUpdate = true;
                    //Вызываем оригинальный метод
                    let result = original.apply(this, args);
                    ObjectControl.skipUpdate = false;
                    //Вызываем метод перехватчик
                    func.call(ObjectControl, this, arrLen, args);
                    return result;
                }, true, true, false)
            );
        });
    }

    /**
     * Устанавливаем объект перехватчика для объекта, который будет проитерирован
     * @param {object} data Данные
     * @param {object} path Путь к компоненту, откуда будет искаться ключ
     * @param {object} key Ключ к наблюдаемому объекту
     * @param {object} name Название для данной установки для предотвращения повторного использования
     */
    static setRroto(data, path, key, name) {
        //Если уже был добавлен флаг, то пропускаем
        if (data.__proto__.hasOwnProperty(name)) return;
        AreaExpanding.set(data, name, true);
        //Если перебирается массив, то ловим вызов методов массива
        if (data.isArray) {
            data.__proto__.__proto__ = this.arrayMethods;
        }
        //Наблюдаем за добавлениями и удалениями в объекте или обновлениями в массиве
        this.changeWatch(data, data.isArray);
        //Добавляем метод для перехода к родительскому объекту
        const parent = Area.getOwnKey(path, key);
        if (parent) AreaExpanding.setWatcher(parent.vars, key);
    }

    /**
     * Перехват метода Push
     * @param {any[]} target Целевой массив
     * @param {number} prevLength Длина массива перед изменением
     * @param {any[]} inserted Массив аргументов вызова метода
     */
    static onPush(target, prevLength, inserted) {
        if (!inserted.length) return;
        let keys = Helper.range(prevLength, inserted.length);
        this.arrayChange(target, keys, this.ACTION_PUSH);
    }

    /**
     * Перехват метода Unshift
     */
    static onUnshift(target, prevLength, inserted) {
        if (!inserted.length) return;
        let keys = Helper.range(0, inserted.length);
        this.arrayChange(target, [0, inserted.length, prevLength], this.ACTION_MOVE);
        this.arrayChange(target, { keys, before: 0 }, this.ACTION_PUSH);
    }

    /**
     * Перехват метода Pop
     */
    static onPop(target, prevLength) {
        if (prevLength < 1) return;
        this.arrayChange(target, target.length, this.ACTION_DELETE);
    }

    /**
     * Перехват метода Shift
     */
    static onShift(target, prevLength) {
        if (prevLength < 1) return;
        this.arrayChange(target, 0, this.ACTION_DELETE);
        this.arrayChange(target, [1, 0, target.length], this.ACTION_MOVE);
    }

    /**
     * Перехват метода Splice
     */
    static onSplice(target, prevLength, inserted) {
        //Собираем аргументы
        let index = +inserted[0];
        let deleteCount = +inserted[1];
        inserted.splice(0, 2);
        //Преобразуем индексы и кол-во удалении
        if (index < 0) index = prevLength + index;
        index = Helper.limit(index, 0, prevLength);
        deleteCount = Helper.limit(deleteCount, 0, prevLength - index);
        //Удаляем, если есть что удалять
        if (deleteCount > 0) {
            let keys = Helper.range(index, deleteCount);
            this.arrayChange(target, keys, this.ACTION_DELETE);
        }
        //Сдвигаем, если сдвигается и существующий индекс
        let diff = inserted.length - deleteCount;
        let moveIndex = index + deleteCount;
        let before = moveIndex;
        if (diff !== 0 && moveIndex < prevLength) {
            let newIndex = moveIndex + diff;
            before = newIndex;
            this.arrayChange(target, [moveIndex, newIndex, prevLength - moveIndex], this.ACTION_MOVE);
        }
        //Добавляем, если есть что добавлять
        if (inserted.length) {
            let keys = Helper.range(index, inserted.length);
            this.arrayChange(target, { keys, before }, this.ACTION_PUSH);
        }
    }

    /**
     * Перехват метода Reverse
     */
    static onReverse(target, prevLength) {
        if (prevLength < 2) return;
        this.arrayChange(target, null, this.ACTION_REVERSE);
    }

    /**
     * Перехват метода Sort
     */
    static onSort(target, prevLength) {
        if (prevLength < 2) return;
        this.arrayChange(target, null, this.ACTION_SORT);
    }

    /**
     * Добавление наблюдателей для объекта
     * @param {object} data Наблюдаемый объект
     * @param {boolean} isArray Является ли data.current массивом
     */
    static changeWatch(data, isArray) {
        data.getHandler().addObjectWatchers(
            isArray ? null : changeParams => {
                //Добавляем свойство
                this.arrayChange(data, [changeParams.prop], this.ACTION_PUSH);
            },
            isArray ? null : changeParams => {
                //Удаляем свойство
                this.arrayChange(data, changeParams.prop, this.ACTION_DELETE);
            },
            changeParams => {
                if (this.skipUpdate) return;
                this.arrayChange(data, changeParams.prop, this.ACTION_REPLACE);
            }
        );
    }

    /**
     * Вызывает событие изменения в массиве через зарегистрированные зависимости в родительском объекте
     * @param {object} target Перебираемый объект
     * @param {number|object} index Ключ измененного элемента
     * @param {number} change Константа из this.ACTION_*
     */
    static arrayChange(target, index, change) {
        const root = target.getWatcher();
        root.vars.getHandler().call(root.key, {
            force: true,
            change, index
        });
    }

}

ObjectControl.createProto();

export default ObjectControl