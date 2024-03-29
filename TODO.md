# Чек лист:

## Общие:
***

**Документация**

- Написать документацию для пользователя
- Написать подробную документацию структуры приложения
- Написать карту взаимодействия данных

**Unit тесты**

- Найти или написать свой тестер
- Покрыть все важные классы и методы тестами (на ошибки и скорость выполнения)
- Сделать сценарии, по которому будет проходить тестирование

## Директивы:
***

**FOR**

- Сделать перебор чисел по формату `m-for="10"` или `m-for="5 to 10"`
- При изменении объекта $create, $update, $delete не срабатывает хуки beforeUpdate, updated
- Появляются для объекта (при переборе) куча наблюдателей в dependency, надо разобраться не появляются лишние (избыточные, было подмечено, когда использовалась директива model, возможно все норм и как-то select multiple, создает для каждого элемента своих наблюдателей)

**SWITCH**

- Сделать директиву для оператора switch case

**MODEL**

- Сделать директиву по формату `m-model` для отслеживания и изменения значении полей ввода, таких как `input, textarea, select`
- Проанализировать директиву, оптимизировать и уменьшить кол-во лишних операции, сделать все TODO

**EVENTS**

- Добавить режимы для событии

## Компоненты:
***

- Оптимизация компонентов и работы с ними, т.к. скорость выполнения низкая при больших данных *

***
### Текущий пул задач:

    - Добавить модуль "Отправка и сбор данных с форм"
    - Добавить модуль "Валидация данных"
    - Добавить модуль "Управление страницой и URI"
    - Добавить модуль "Работа с хранилищами"
    - Добавить модуль "Общение с сервером"