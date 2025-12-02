require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

// Middleware to parse JSON bodies from the frontend
app.use(express.json());

// 1. Serve static files
app.use(express.static(__dirname));

// 2. Main route (The UI)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. API Route (The Backend Logic)
// The frontend calls THIS endpoint, not Google directly.
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!API_KEY) {
            return res.status(500).json({ error: "Server missing API Key in .env file" });
        }

        // Call Google Gemini API from the Server
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userMessage }] }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API Error');
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found.";

        // Send just the text back to the frontend
        res.json({ reply: aiText });

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 4. Start Server
app.listen(PORT, () => {
    console.log(`\n--------------------------------------------------`);
    console.log(`🤖 AI Chat Bot Server Running`);
    console.log(`🔑 API Key Loaded: ${API_KEY ? 'Yes (Encoded)' : 'NO - Check .env file!'}`);
    console.log(`🌍 Open: http://localhost:${PORT}`);
    console.log(`--------------------------------------------------\n`);
});