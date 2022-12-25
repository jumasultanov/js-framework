# JS фреймворк (client) по типу реактивного изменения контента страницы

## Схема работы

***

1. **View**

    HTML, которая состоит из блоков-компонентов со специальным аттрибутом маркером 
    
    `<tagName m-block="blockName:controllerName"></tagName>`

2. **Model**

    Блок парсится и строится объект компонента

3. **Controller**

    При парсинге значение атрибута `m-block` может содержать название контроллера после `":"`, которая загружает контроллер для компонента

4. **Init**

    После парсинга всех блоков-компонентов просходит инициализация всех компонентов

5. **Reactive**

    Далее запускается модуль реактивного изменения DOM с данными объекта компонента


## Сервисы
***
* **Общение с сервером**

    HTTP-запросы, получение и обработка ответов по статусу и передаваемым данным

* **Работа с хранилищами**

    Добавление, изменение, удаление данных, лежащих в cookie, localStorage, sessionStorage

* **Управление страницой и URI**

    Контроль ссылок, которые отмечены, как нужно переходить по ссылке, без перезагрузки или с перезагрузкой. Простая перезагрузка страницы.

* **Связь между компонентами**

    Обращение к другим компонентам по их пространству имен

* **Событии**

    Добавление, удаление обработчиков для системных и пользовательских событии, как внутри компонентов, так и общих событии

* **Валидация данных**

    Проверка данных полей, которые вводит пользователь по условиям в компоненте

