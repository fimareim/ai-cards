const express = require('express');
const path = require('path');
const axios = require('axios'); // Используем axios вместо fetch

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const HF_TOKEN = process.env.HF_TOKEN;

// --- ЭНДПОИНТ ГЕНЕРАЦИИ ТЕКСТА ---
app.post('/api/generate-text', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            {
                inputs: `<s>[INST] ${prompt} [/INST]`,
                parameters: { max_new_tokens: 150, temperature: 0.7, return_full_text: false }
            },
            {
                headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' }
            }
        );
        
        const generatedText = response.data[0].generated_text.trim();
        res.json({ text: generatedText });
    } catch (error) {
        console.error("Text API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Ошибка генерации текста' });
    }
});

// --- ЭНДПОИНТ ГЕНЕРАЦИИ КАРТИНКИ ---
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
            { inputs: prompt },
            {
                headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
                responseType: 'arraybuffer' // Важно для получения картинок
            }
        );

        // Отправляем бинарные данные картинки на фронтенд
        res.set('Content-Type', 'image/png');
        res.send(response.data);
        
    } catch (error) {
        console.error("Image API Error:", error.response ? error.response.data.toString() : error.message);
        res.status(500).json({ error: 'Ошибка генерации изображения' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    if (!HF_TOKEN) console.warn("ВНИМАНИЕ: HF_TOKEN не найден в переменных окружения!");
});
