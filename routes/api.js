const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Controllers
const aiController = require('../controllers/aiController');
const weatherController = require('../controllers/weatherController');

// Test route
router.get('/status', (req, res) => {
    res.json({ status: 'API is running' });
});

// Example route structure for Gemini integration
router.post('/crop-advisor', aiController.getCropAdvice);
router.post('/disease-detect', upload.single('image'), aiController.detectDisease);

// Route for Weather
router.post('/weather', weatherController.getWeather);

// Route for Fertilizer
router.post('/fertilizer-recommend', aiController.getFertilizerRecommendation);

// Route for Government Schemes
router.post('/schemes', aiController.getGovernmentSchemes);

// Route for AI Chat (Hindi Voice Assistant)
router.post('/chat', aiController.handleChat);

module.exports = router;
