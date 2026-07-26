// DOM Elements
const occasionSelect = document.getElementById('occasion');
const recipientNameInput = document.getElementById('recipientName');
const artStyleSelect = document.getElementById('artStyle');
const fontStyleSelect = document.getElementById('fontStyle');
const textColorInput = document.getElementById('textColor');
const generateBtn = document.getElementById('generateBtn');
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
const loadingState = document.getElementById('loadingState');
const placeholderState = document.getElementById('placeholderState');
const actionButtons = document.getElementById('actionButtons');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');

document.fonts.ready.then(() => { console.log("Шрифты загружены"); });

// Генерация текста через Puter AI (GPT-4o mini)
async function generateText(occasion, name) {
    let prompt = `Напиши очень душевное, красивое и уникальное поздравление для события: "${occasion}".`;
    if (name) {
        prompt += ` Обратись к имени: ${name}.`;
    }
    prompt += ` Текст должен быть емким (2-3 предложения). Без кавычек и без лишних вступлений. Только сам текст поздравления.`;
    
    // Puter возвращает объект, берем сообщение из message.content
    const response = await puter.ai.chat(prompt);
    return response.message.content;
}

// Генерация картинки через Puter AI (DALL-E 3)
async function generateImage(imagePrompt) {
    // Возвращает HTML <img> элемент
    const imgElement = await puter.ai.txt2img(imagePrompt);
    return imgElement.src;
}

// Разбивка текста на строки с учетом ширины
function getWrappedLines(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (context.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

generateBtn.addEventListener('click', async () => {
    const occasion = occasionSelect.value;
    const name = recipientNameInput.value.trim();
    const artStyle = artStyleSelect.value;
    const font = fontStyleSelect.value;
    const color = textColorInput.value;

    // UI: Loading state
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').classList.add('hidden');
    generateBtn.querySelector('.btn-loader').classList.remove('hidden');
    placeholderState.classList.add('hidden');
    canvas.classList.add('hidden');
    actionButtons.classList.add('hidden');
    loadingState.classList.remove('hidden');
    loadingState.innerHTML = '<div class="spinner"></div><p>ИИ творит магию...<br><small>Генерация может занять 15-30 секунд</small></p>';

    try {
        const imagePrompt = `Illustration for ${occasion}, ${artStyle}, no text, beautiful lighting, highly detailed`;
        
        // Параллельный запрос текста и картинки
        const [greetingText, imageUrl] = await Promise.all([
            generateText(occasion, name),
            generateImage(imagePrompt)
        ]);

        // Загружаем сгенерированную картинку
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("Image load failed"));
            image.src = imageUrl;
        });

        // --- Отрисовка на Canvas ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = parseInt(font.match(/\d+/)[0]);
        ctx.font = font;
        
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const maxWidth = canvas.width - 80;
        const lines = getWrappedLines(ctx, greetingText, maxWidth);
        const lineHeight = fontSize * 1.3;
        const totalTextHeight = lines.length * lineHeight;
        
        let startY = canvas.height - 60 - (totalTextHeight / 2) + (lineHeight / 2);

        lines.forEach(line => {
            ctx.fillText(line, canvas.width / 2, startY);
            startY += lineHeight;
        });

        ctx.shadowColor = "transparent";

        // UI: Success state
        loadingState.classList.add('hidden');
        canvas.classList.remove('hidden');
        actionButtons.classList.remove('hidden');

    } catch (error) {
        console.error("Детали ошибки:", error);
        loadingState.innerHTML = `
            <p style="color: #ff4444;">⚠️ Произошла ошибка генерации.</p>
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 10px;">${error.message}<br>Попробуйте еще раз.</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ff00cc; color: white; border: none; border-radius: 8px; cursor: pointer;">Попробовать снова</button>
        `;
    } finally {
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').classList.remove('hidden');
        generateBtn.querySelector('.btn-loader').classList.add('hidden');
    }
});

// Скачивание
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'ai-greeting-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Поделиться (Web Share API)
shareBtn.addEventListener('click', async () => {
    try {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'ai-card.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Моя ИИ-открытка',
                    text: 'Смотри, какую открытку я сгенерировал!'
                });
            } else {
                alert('Ваш браузер не поддерживает прямое sharing изображений. Скачайте открытку и отправьте вручную.');
            }
        });
    } catch (err) {
        console.error("Share error:", err);
    }
});
