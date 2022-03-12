class Log {

    static DRIVER_CONSOLE = 1;
    static DRIVER_SERVER = 2;

    static TYPE_SIMPLE = 1;
    static TYPE_WARN = 2;
    static TYPE_ERROR = 3;
    static TYPE_INFO = 4;

    message;
    type;
    group;
    driver;

    /**
     * @param {any|any[]} message Сообщение
     * @param {number|number[]} type Тип
     * @param {string} group Группа/категория
     * @param {number} driver Место вывода
     */
    constructor(message, type, group, driver) {
        Object.assign(this, { message, type, group, driver });
        if (!this.driver) this.driver = Log.DRIVER_CONSOLE;
    }

    /**
     * Запись в лог
     * @returns {boolean}
     */
    send() {
        switch (this.driver) {
            case Log.DRIVER_CONSOLE:    return this.displayConsole();
            case Log.DRIVER_SERVER:     return this.sendServer();
            default:                    return false;
        }
    }

    /**
     * Запись в консоль
     * @returns {boolean}
     */
    displayConsole() {
        let data = this.message;
        if (!(data instanceof Array)) data = [data];
        if (this.group) console.group(this.group);
        const isArrType = Array.isArray(this.type);
        data.forEach((message, index) => {
            let method = Log.getConsoleMethod(
                isArrType ? this.type[index] : this.type
            );
            console[method](message);
        });
        if (this.group) console.groupEnd();
        return true;
    }

    /**
     * Возвращает метод объекта console по константе Log.TYPE_*
     * @param {number} type 
     * @returns {string}
     */
    static getConsoleMethod(type) {
        switch (type) {
            case Log.TYPE_SIMPLE:   return 'log';
            case Log.TYPE_WARN:     return 'warn';
            case Log.TYPE_ERROR:    return 'error';
            case Log.TYPE_INFO:     return 'info';
            default:                return 'log';
        }
    }

    /**
     * Запись на сервер
     * @returns {boolean}
     */
    sendServer() {
        // TODO: 
        return false;
    }

    /**
     * Вывод сообщения в лог
     * @see constructor arguments
     * @returns {boolean} Результат отправки
     */
    static send(message, type, group, driver) {
        return (
            new this( message, type, group, driver )
        ).send();
    }

}

export default Log