document.addEventListener("DOMContentLoaded", async () => {
    
    //Запускаем приложение
    (await import('./Core/App.js')).default.init(document.body);

});