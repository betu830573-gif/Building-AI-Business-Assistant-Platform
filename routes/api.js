const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const aiController = require('../controllers/aiController');

// Health check
router.get('/status', (req, res) => res.json({ status: 'AI Business Assistant API is running', version: '2.0.0' }));

// Sales data upload + analysis
router.post('/upload-sales', upload.single('salesFile'), aiController.uploadAndAnalyzeSales);

// AI insights from sales data
router.post('/ai-insights', aiController.getAIInsights);

// Inventory forecasting
router.post('/inventory-forecast', aiController.forecastInventory);

// Business chatbot
router.post('/chat', aiController.handleBusinessChat);

// Report generation
router.post('/generate-report', aiController.generateReport);

module.exports = router;
