const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());
// Раздаем статические файлы (наш фронтенд)
app.use(express.static(__dirname));

const HF_TOKEN = process.env.HF_TOKEN; // Мы добавим этот ключ в настройки Render

// --- ЭНДПОИНТ ГЕНЕРАЦИИ ТЕКСТА ---
app.post('/api/generate-text', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `<s>[INST] ${prompt} [/INST]`,
                parameters: { max_new_tokens: 150, temperature: 0.7, return_full_text: false }
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        const generatedText = data[0].generated_text.trim();
        res.json({ text: generatedText });
    } catch (error) {
        console.error("Text API Error:", error);
        res.status(500).json({ error: 'Ошибка генерации текста' });
    }
});

// --- ЭНДПОИНТ ГЕНЕРАЦИИ КАРТИНКИ ---
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
    try {
        // Используем Flux.1-schnell (очень быстрая и качественная бесплатная модель)
        const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Image generation failed');
        }

        // Получаем картинку как бинарные данные и отправляем на фронтенд
        const imageBuffer = await response.arrayBuffer();
        res.set('Content-Type', 'image/png');
        res.send(Buffer.from(imageBuffer));
        
    } catch (error) {
        console.error("Image API Error:", error);
        res.status(500).json({ error: 'Ошибка генерации изображения' });
    }
});

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    if (!HF_TOKEN) console.warn("ВНИМАНИЕ: HF_TOKEN не найден в переменных окружения!");
});
