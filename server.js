
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Сообщаем серверу, где лежат наши статические файлы (index.html, style.css, script.js)
app.use(express.static(__dirname));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
