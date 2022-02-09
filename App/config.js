export const AppConfig = {
    //Папка кастомных контроллеров
    controllerPath: '/App/Controller'
}

export const ParserConfig = {
    //Регулярка для поиска шаблона в тексте (без формирования подгрупп)
    exprInText: /{{[^}]*}}/g, // RegEXP /\{\{((?:.|\r?\n)+?)\}\}/g -> for VueJS
    //Атрибут для блока-компонента
    componentAttr: 'm-block',
    //Префикс для конструкции
    prefixConstr: 'm-',
    //Префикс для имен компонентов, создаваемых конструкциями
    prefixCCName: '#construction'
}

export const DirectiveConfig = {
    
}

export const ConnectConfig = {
    //
}