const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini API
let ai;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

exports.getCropAdvice = async (req, res) => {
    try {
        const { crop, location, season } = req.body;
        if (!ai) {
            return res.status(500).json({ error: 'Gemini API is not configured.' });
        }

        const prompt = `Act as an expert agricultural advisor for Indian farmers. The farmer is growing ${crop} in ${location} during the ${season} season. Provide actionable advice covering sowing tips, irrigation schedule, and harvesting guidance. Keep the language simple, encouraging, and clear. Format the output with clear headings.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ advice: response.text });
    } catch (error) {
        console.error('Error getting crop advice:', error);
        res.status(500).json({ error: 'Failed to generate crop advice.' });
    }
};

exports.detectDisease = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        if (!ai) {
            return res.status(500).json({ error: 'Gemini API is not configured.' });
        }

        // Convert uploaded file to base64 for Gemini API
        const base64Image = req.file.buffer.toString('base64');
        
        const prompt = 'Act as an expert plant pathologist. Analyze this image of a crop leaf. Identify any visible plant diseases. If a disease is found, state the disease name, its cause, and suggest treatment and prevention tips for a farmer. If the plant looks healthy, mention that.';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: req.file.mimetype
                    }
                }
            ],
        });

        res.json({ analysis: response.text });
    } catch (error) {
        console.error('Error detecting disease:', error);
        res.status(500).json({ error: 'Failed to analyze the image.' });
    }
};

exports.getFertilizerRecommendation = async (req, res) => {
    try {
        const { crop, soilType } = req.body;
        if (!ai) {
            return res.status(500).json({ error: 'Gemini API is not configured.' });
        }

        const prompt = `Act as an expert agronomist. A farmer is growing ${crop} in ${soilType} soil. Provide specific fertilizer recommendations (organic and synthetic if applicable) and the ideal timing/schedule for their application. Format the output clearly.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ recommendation: response.text });
    } catch (error) {
        console.error('Error getting fertilizer recommendation:', error);
        res.status(500).json({ error: 'Failed to generate recommendation.' });
    }
};

exports.getGovernmentSchemes = async (req, res) => {
    try {
        const { state, category } = req.body;
        if (!ai) {
            return res.status(500).json({ error: 'Gemini API is not configured.' });
        }

        const prompt = `Act as an agricultural expert in India. Provide a list of relevant central and state government agricultural schemes, subsidies, and benefits for a farmer in ${state} who belongs to the ${category} category. Include details on benefits and required documents.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ schemes: response.text });
    } catch (error) {
        console.error('Error getting government schemes:', error);
        res.status(500).json({ error: 'Failed to fetch schemes.' });
    }
};

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!ai) {
            return res.status(500).json({ error: 'Gemini API is not configured.' });
        }

        const prompt = `You are KrishiMitra, an AI assistant for farmers. Answer the following question in Hindi. Keep your answer brief, encouraging, and easy to understand for a farmer: "${message}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error('Error handling chat:', error);
        res.status(500).json({ error: 'Failed to process chat message.' });
    }
};
