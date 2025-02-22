require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

async function extractText(file) {
    const buffer = file.buffer;
    const type = file.mimetype;

    if (type === 'application/pdf') {
        const data = await pdfParse(buffer);
        return data.text;
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: buffer });
        return result.value;
    } else if (type === 'text/plain') {
        return buffer.toString('utf-8');
    } else {
        throw new Error('Unsupported file type');
    }
}

function chunkText(text, maxChunkSize = 2000) {
    const chunks = [];
    let currentChunk = '';
    const paragraphs = text.split(/\n\s*\n/);
    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    return chunks;
}


app.post('/api/chat', upload.single('file'), async (req, res) => {
    try {
        const userMessage = req.body.message;
        const conversationHistory = req.body.history ? JSON.parse(req.body.history) : [];
        let documentText = "";

        if (req.file) {
            documentText = await extractText(req.file);
        }

        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let prompt = '';
        // Determine the system prompt based on whether a file is present
        let systemPrompt = "You are a helpful assistant."; // Default system prompt

        if (documentText) {
            const chunks = chunkText(documentText);
            systemPrompt = "You are a helpful assistant. If the provided document contains the answer, answer the user's question based on the document. If the document does *not* contain the answer, respond with: 'I am sorry, but I do not have enough information to answer that question.'";
            prompt = "Document Context:\n\n" + chunks.join('\n\n') + "\n\nQuestion: " + userMessage;
        } else {
            // If no file, just use the user's message as the prompt
            prompt = userMessage;
        }

        const messages = [
            {
                role: "system",
                content: systemPrompt, // Use the dynamically determined system prompt
            },
            ...conversationHistory,
            { role: "user", content: prompt }
        ];
        const openRouterResponse = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "google/gemini-2.0-flash-exp:free", //  CORRECT MODEL ID!
                messages: messages,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const botReply = openRouterResponse.data.choices[0].message.content;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Error communicating with OpenRouter:", error.response ? error.response.data : error.message);
        const openRouterError = error.response ? error.response.data : { error: { message: error.message } };
        res.status(500).json({ error: 'Failed to get a response from the chatbot', details: openRouterError.error });
    }
});


app.listen(port, () => {
    console.log(`Chatbot backend listening on port ${port}`);
});