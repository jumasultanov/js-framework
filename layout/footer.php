    <footer class="container" m-block="footer">
        <p>&copy; Company 2022</p>
    </footer>
    <script>
        var globals = {
            vars: {
                param1: 'str',
                isValid: false,
                count: 0,
                counter: 100,
                types: {
                    num: 'number',
                    str: 'string',
                    bool: 'boolean'
                }
            },
            content: {
                vars: {
                    users: [
                        {id: 1, name: 'Ivan', have: { cat: true, dog: true }},
                        {id: 2, name: 'John', have: { cat: true, dog: true }},
                        {id: 3, name: 'Lisa', prof: 'manager', have: { cat: true, dog: true }},
                        {id: 4, name: 'Kate', have: { cat: true, dog: true }},
                        {id: 5, name: 'Scarlet', have: { cat: true, dog: true }},
                        {id: 6, name: 'Piter', have: { cat: true, dog: true }},
                    ],
                    countries: {
                        england: {id: 1, ru: 'Англия'},
                        france: {id: 2, ru: 'Франция'},
                        germany: {id: 3, ru: 'Германия'},
                        italy: {id: 4, ru: 'Италия'},
                        canada: {id: 5, ru: 'Канада'},
                    },
                    numbers: {a:30,b:40,c:10,d:100,e:5},
                    numberFrom: 5,
                    numberTo: 10
                },
                description: {
                    vars: {
                        previewText: 'Simple description for this text'
                    }
                },
                author: {
                    vars: {
                        author: 'Unknown',
                        prof: 'Manager',
                        user: {
                            name: {
                                short: 'Sam'
                            }
                        }
                    }
                },
            }
        }
    </script>
    <script src="/test.js"></script>
</body>
</html>