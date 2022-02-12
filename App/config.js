export const AppConfig = {
    //Папка кастомных контроллеров
    controllerPath: '/App/Controller'
}

export const ParserConfig = {
    //Регулярка для поиска шаблона в тексте (без формирования подгрупп)
    exprInText: /{{[^}]*}}/g, // RegEXP /\{\{((?:.|\r?\n)+?)\}\}/g -> for VueJS
    //Атрибут для блока-компонента
    componentAttr: 'm-block',
    //Префикс атрибута для конструкции
    prefixConstr: 'm-',
    //Префикс для имен компонентов, создаваемых конструкциями
    prefixCCName: '#construction',
    //Префикс для добавления события на элементе
    prefixEvent: '@',
    //Префикс для добавления атрибута на элементе
    prefixAttr: ':'
}

export const ConnectConfig = {
    //
}