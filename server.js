const express = require('express');
const path = require('path');
const axios = require('axios');
const https = require('https'); // Добавили модуль для настройки сети

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const HF_TOKEN = process.env.HF_TOKEN;

// Создаем агента, который принудительно использует IPv4
// Это обходит баг Render.com с неработающим DNS по умолчанию
const httpsAgent = new https.Agent({ family: 4 });

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
                headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
                httpsAgent: httpsAgent // <-- ПРИМЕНЯЕМ ФИКС СЕТИ
            }
        );
        
        const generatedText = response.data[0].generated_text.trim();
        res.json({ text: generatedText });
    } catch (error) {
        console.error("Text API Error:", error.response ? JSON.stringify(error.response.data) : error.message);
        res.status(500).json({ error: 'Ошибка генерации текста. Подробности в логах сервера.' });
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
                responseType: 'arraybuffer',
                httpsAgent: httpsAgent // <-- ПРИМЕНЯЕМ ФИКС СЕТИ
            }
        );

        res.set('Content-Type', 'image/png');
        res.send(response.data);
        
    } catch (error) {
        console.error("Image API Error:", error.response ? error.response.data.toString() : error.message);
        res.status(500).json({ error: 'Ошибка генерации изображения. Подробности в логах сервера.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    if (!HF_TOKEN) console.warn("ВНИМАНИЕ: HF_TOKEN не найден в переменных окружения!");
});
