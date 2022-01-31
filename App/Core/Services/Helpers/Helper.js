class Helper {

    static getDescriptor(value, configurable = true, writable = true, enumerable = true) {
        return { value, configurable, writable, enumerable }
    }

}

export default Helper