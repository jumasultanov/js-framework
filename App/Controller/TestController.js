import Controller from '../Core/Controller.js';

class TestController extends Controller {

    constructor() {
        super();
        console.log('START TestController');
    }

    click() {
        console.log('CLICK');
    }

}

export default TestController