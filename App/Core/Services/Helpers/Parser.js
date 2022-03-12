class Parser {

    static regExprObj = /(?<next>[,])|(?<set>[:])|(?<open>[\[\{])|(?<close>[\]\}])|(\".*?\")|('.*?')/gi;

    /**
     * Нахождение выражении в строке в виде объекта
     * @param {string} str 
     * @param {function} callback 
     */
    static match(str, callback) {
        let match, start = 0, list = [], depth = 0;
        //Ищем вхождения по регулярке
        while ((match = this.regExprObj.exec(str)) !== null) {
            let save = false,
                push = false;
            //Изменяем глубину
            if (match.groups.open) depth++;
            if (match.groups.close) depth--;
            //Проверка для пропуска
            if (depth > 1) continue; // TODO: max depth
            //Если группа для перехода к след. элементу или закрывающая, то добавляем и отдаем
            if (match.groups.next || match.groups.close) {
                save = true;
                push = true;
            //Если группа указания значения, то добавляем
            } else if (match.groups.set) {
                push = true;
            } else if (match.groups.open) {
            //Если без групп, то пропускаем
            } else continue;
            //Добавляем в массив строку до текущего индекса группы
            if (push) {
                let item = match.input.substring(start, match.index);
                if (match.groups.close && depth > 0) item += match.groups.close;
                //Убираем пробулы с концов
                item = item.trim();
                //Если не пусто, то добавляем, иначе не сохраняем
                if (item) list.push(item);
                else save = false;
            }
            //Сдвигаем индекс начала обрезки
            start = match.index + 1;
            if (save) {
                //Вызывем колбэк с найденными значениями
                callback(list[0], list[1]||list[0]);
                list = [];
            }
        }
    }

}

export default Parser