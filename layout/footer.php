    <footer class="container" m-block="footer">
        <p>&copy; Company 2022</p>
    </footer>
    <script>
        var globals = {
            vars: {
                param1: 'str',
                isValid: false,
                count: 5,
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
                    ]
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