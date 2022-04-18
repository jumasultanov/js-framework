import { Log } from '../../Service.js';
import Transform from './Transform.js';

class Query {

    static METHOD_GET = 'GET';
    static METHOD_POST = 'POST';
    static METHOD_PUT = 'PUT';
    static METHOD_DELETE = 'DELETE';
    static METHOD_PATCH = 'PATCH';
    static METHOD_OPTIONS = 'OPTIONS';

    static CONTENT_TEXT = 'text';
    static CONTENT_JSON = 'json';
    static CONTENT_FORMDATA = 'formData';
    static CONTENT_BLOB = 'blob';
    static CONTENT_ARRAY_BUFFER = 'arrayBuffer';

    method;
    url;
    $headers;
    data;

    constructor(method, url, base = location.origin) {
        this.method = method;
        this.url = new URL(url, base);
    }

    headers(data) {
        this.$headers = data;
        return this;
    }

    transformData() {
        if (this.method == Query.METHOD_GET) return Transform.asURL(this.data, this.url);
        this.body = Transform.asBody(this.data);
    }

    send(data = null, contentType = Query.CONTENT_TEXT) {
        this.clearLast();
        this.data = data;
        this.transformData();
        const options = {
            method: this.method,
            headers: this.$headers
        };
        if (this.body) options.body = this.body;
        return new Promise((resolve, reject) => {
            fetch(this.url, options)
                .then(response => (this.response = response)[contentType]())
                .then(data => {
                    const result = {
                        status: this.response.status,
                        data: data,
                        query: this
                    };
                    if (this.response.status < 400) return resolve(result);
                    return reject(result);
                })
                .catch(err => {
                    Log.send(
                        [err.message, this],
                        [Log.TYPE_ERROR],
                        'HTTP request'
                    );
                    return reject();
                });
        });
    }

    clearLast() {
        this.response = undefined;
        this.body = undefined;
    }

}

export default Query