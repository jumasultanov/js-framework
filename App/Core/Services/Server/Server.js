import Query from './Query.js';

class Server {

    // TODO: отправка запросов и чтение ответов, после передача ответа в Request

    /**
     * Создание канала связи
     * @returns {WebSocket}
     */
    static socket() {
        // TODO: 
    }

    /**
     * Ниже методы HTTP/S-запроса
     * @param {string} url Путь запроса
     * @param {string} base Домен пути, по умолчанию - текущий домен
     * @returns {Query}
     */

    static get(url, base) {
        return new Query(Query.METHOD_GET, url, base);
    }

    static post(url, base) {
        return new Query(Query.METHOD_POST, url, base);
    }

    static put(url, base) {
        return new Query(Query.METHOD_PUT, url, base);
    }

    static delete(url, base) {
        return new Query(Query.METHOD_DELETE, url, base);
    }

    static patch(url, base) {
        return new Query(Query.METHOD_PATCH, url, base);
    }

    static options(url, base) {
        return new Query(Query.METHOD_OPTIONS, url, base);
    }

}

export default Server