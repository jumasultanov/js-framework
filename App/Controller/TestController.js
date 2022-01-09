import Controller from '../Core/Controller.js';

class TestController extends Controller {

    constructor() {
        console.log('START TestController');
    }

    click() {
        console.log('CLICK');
    }

}

export default TestController