// Mock aiController.js - Replaced Gemini API with dummy data

exports.getCropAdvice = async (req, res) => {
    try {
        const { crop, location, season } = req.body;
        // Mock response
        const advice = `### 🌿 ${crop} Farming Advice for ${location} (${season})

**Sowing Tips:**
- Use high-quality, certified seeds.
- Ensure proper spacing between rows to allow sunlight and aeration.
- Treat seeds with organic fungicides before planting to prevent soil-borne diseases.

**Irrigation Schedule:**
- Apply first irrigation immediately after sowing if the soil is dry.
- Provide regular irrigation every 10-15 days during the critical growth stages.
- Avoid waterlogging in the field as it can damage the roots.

**Harvesting Guidance:**
- Harvest when the crop reaches full maturity (e.g., leaves turn yellow/brown).
- Store the harvested produce in a cool, dry place to prevent moisture and pest attacks.
- Good luck with your farming!`;

        // Simulate network delay
        setTimeout(() => res.json({ advice }), 1500);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate crop advice.' });
    }
};

exports.detectDisease = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        // Mock response
        const analysis = `### 🔍 Disease Analysis Report

**Disease Identified:** Leaf Spot / Early Blight (Mock Detection)

**Cause:** 
This is usually caused by fungal pathogens thriving in warm and humid conditions.

**Treatment & Prevention:**
- **Organic:** Spray Neem oil mixed with mild soap water every 7 days.
- **Chemical:** Use a copper-based fungicide or Mancozeb as per agricultural guidelines.
- **Prevention:** Ensure proper spacing for air circulation and avoid overhead watering to keep leaves dry.`;

        setTimeout(() => res.json({ analysis }), 2000);
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze the image.' });
    }
};

exports.getFertilizerRecommendation = async (req, res) => {
    try {
        const { crop, soilType } = req.body;

        // Mock response
        const recommendation = `### 🌱 Fertilizer Plan for ${crop} in ${soilType} Soil

**Organic Options:**
- **Vermicompost:** Apply 2-3 tonnes per acre during soil preparation.
- **Cow Dung Manure:** Highly effective for ${soilType} soil to improve water retention.

**Synthetic Options (NPK):**
- Use a balanced NPK ratio (e.g., 19:19:19) depending on the exact soil test.
- Urea: Apply in split doses (30% at sowing, 70% during vegetative growth).

**Schedule:**
1. **Basal Dose:** At the time of sowing.
2. **Top Dressing:** 30-40 days after sowing.`;

        setTimeout(() => res.json({ recommendation }), 1500);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate recommendation.' });
    }
};

exports.getGovernmentSchemes = async (req, res) => {
    try {
        const { state, category } = req.body;

        // Mock response
        const schemes = `### 🏛️ Relevant Schemes for ${category} Farmers in ${state}

**1. PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**
- **Benefit:** ₹6,000 per year transferred directly to bank accounts.
- **Documents Required:** Aadhaar Card, Land ownership papers, Bank account details.

**2. PMFBY (Pradhan Mantri Fasal Bima Yojana):**
- **Benefit:** Crop insurance against natural calamities at a very low premium.
- **Documents Required:** Sowing certificate, Aadhaar, Bank Passbook.

**3. State Subsidy on Farm Equipment:**
- **Benefit:** Up to 40-50% subsidy on purchasing tractors and modern farm tools for ${category} category.
- **Apply:** Contact your local Krishi Bhavan or state agriculture portal.`;

        setTimeout(() => res.json({ schemes }), 1500);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schemes.' });
    }
};

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        
        // Mock response
        const reply = "यह एक डेमो उत्तर है! आपने पूछा था: '" + message + "'। असली सिस्टम में यहाँ AI आपको खेती से जुड़ी एक अच्छी और सटीक सलाह देगा।";

        setTimeout(() => res.json({ reply }), 1000);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process chat message.' });
    }
};
