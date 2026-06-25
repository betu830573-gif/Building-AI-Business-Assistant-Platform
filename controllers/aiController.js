const { GoogleGenAI } = require('@google/genai');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Readable } = require('stream');

// In-memory session store for uploaded sales data
const sessionStore = new Map();
const SESSION_KEY = 'current_sales_data';

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ─── Helper: Parse CSV buffer ───────────────────────────────────────────────
function parseCSV(buffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer.toString('utf-8'));
        stream
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// ─── Helper: Parse Excel buffer ─────────────────────────────────────────────
function parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
}

// ─── Helper: Compute KPIs from rows ─────────────────────────────────────────
function computeKPIs(rows) {
    if (!rows || rows.length === 0) return null;

    // Detect column names flexibly
    const keys = Object.keys(rows[0]).map(k => k.trim());
    const findCol = (...names) => keys.find(k => names.some(n => k.toLowerCase().includes(n.toLowerCase())));

    const productCol = findCol('product', 'item', 'name', 'Product Name');
    const revenueCol = findCol('revenue', 'amount', 'sales', 'total', 'price');
    const quantityCol = findCol('quantity', 'qty', 'units', 'sold');
    const dateCol = findCol('date', 'Date', 'month', 'period');

    let totalRevenue = 0;
    const productMap = {};
    const monthlyMap = {};

    rows.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => { cleanRow[k.trim()] = row[k]; });

        const revenue = parseFloat(cleanRow[revenueCol]) || 0;
        const qty = parseFloat(cleanRow[quantityCol]) || 0;
        const product = cleanRow[productCol] || 'Unknown';
        const date = cleanRow[dateCol] || '';

        totalRevenue += revenue;

        if (!productMap[product]) productMap[product] = { revenue: 0, quantity: 0 };
        productMap[product].revenue += revenue;
        productMap[product].quantity += qty;

        // Monthly grouping
        const month = date ? date.substring(0, 7) : 'Unknown';
        if (!monthlyMap[month]) monthlyMap[month] = 0;
        monthlyMap[month] += revenue;
    });

    // Sort products by revenue
    const topProducts = Object.entries(productMap)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));

    // Monthly trend sorted
    const monthlyTrend = Object.entries(monthlyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, revenue]) => ({ month, revenue }));

    const avgDailySales = rows.length > 0 ? totalRevenue / Math.max(monthlyTrend.length || 1, 1) : 0;

    // Growth calculation
    let growthPercent = 0;
    if (monthlyTrend.length >= 2) {
        const last = monthlyTrend[monthlyTrend.length - 1].revenue;
        const prev = monthlyTrend[monthlyTrend.length - 2].revenue;
        growthPercent = prev > 0 ? (((last - prev) / prev) * 100).toFixed(1) : 0;
    }

    return {
        totalRevenue: totalRevenue.toFixed(2),
        totalTransactions: rows.length,
        topProducts,
        monthlyTrend,
        avgMonthlySales: avgDailySales.toFixed(2),
        growthPercent,
        columns: { productCol, revenueCol, quantityCol, dateCol },
        rawRows: rows.slice(0, 50) // send first 50 rows as preview
    };
}

// ─── Helper: Call Gemini ─────────────────────────────────────────────────────
async function callGemini(prompt) {
    const model = genAI.models ? genAI : genAI;
    const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
    });
    return response.text;
}

// ════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

// POST /api/upload-sales
exports.uploadAndAnalyzeSales = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Please upload a CSV or Excel file.' });
        }

        const filename = req.file.originalname.toLowerCase();
        let rows = [];

        if (filename.endsWith('.csv')) {
            rows = await parseCSV(req.file.buffer);
        } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
            rows = parseExcel(req.file.buffer);
        } else {
            return res.status(400).json({ error: 'Unsupported file format. Please upload a CSV or Excel file.' });
        }

        if (rows.length === 0) {
            return res.status(400).json({ error: 'File is empty or could not be parsed.' });
        }

        const kpis = computeKPIs(rows);

        // Store in session for chat context
        sessionStore.set(SESSION_KEY, { rows, kpis, filename: req.file.originalname });

        res.json({ success: true, kpis, message: `Successfully parsed ${rows.length} records from ${req.file.originalname}` });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process uploaded file. Please check the format and try again.' });
    }
};

// POST /api/ai-insights
exports.getAIInsights = async (req, res) => {
    try {
        const session = sessionStore.get(SESSION_KEY);
        const { kpis } = req.body;
        const dataKpis = kpis || (session && session.kpis);

        if (!dataKpis) {
            return res.status(400).json({ error: 'No sales data available. Please upload your data first.' });
        }

        const topProductsList = dataKpis.topProducts
            .slice(0, 5)
            .map((p, i) => `${i + 1}. ${p.name}: $${p.revenue} revenue, ${p.quantity} units`)
            .join('\n');

        const monthlyList = dataKpis.monthlyTrend
            .slice(-6)
            .map(m => `${m.month}: $${m.revenue}`)
            .join('\n');

        const prompt = `You are a business intelligence analyst. Analyze this sales data and provide actionable insights.

Business Sales Data Summary:
- Total Revenue: $${dataKpis.totalRevenue}
- Total Transactions: ${dataKpis.totalTransactions}
- Monthly Growth: ${dataKpis.growthPercent}%
- Average Monthly Sales: $${dataKpis.avgMonthlySales}

Top Products:
${topProductsList}

Monthly Revenue Trend (last 6 months):
${monthlyList}

Provide:
1. **Key Insights** (3-4 bullet points about what's working well)
2. **Growth Opportunities** (2-3 specific, actionable recommendations)
3. **Risk Alerts** (any concerning patterns to watch)
4. **Quick Wins** (1-2 things to do this week to increase revenue)

Format with clear sections using markdown bold headers. Be specific, practical and concise.`;

        const insight = await callGemini(prompt);
        res.json({ insight });
    } catch (error) {
        console.error('AI insights error:', error);
        res.status(500).json({ error: 'Failed to generate AI insights. Please check your Gemini API key in .env file.' });
    }
};

// POST /api/inventory-forecast
exports.forecastInventory = async (req, res) => {
    try {
        const { products, timeframe } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'Please provide product inventory data.' });
        }

        const session = sessionStore.get(SESSION_KEY);
        const salesContext = session ? `
Historical Sales Context:
- Total Revenue: $${session.kpis.totalRevenue}
- Top Products: ${session.kpis.topProducts.slice(0, 3).map(p => p.name).join(', ')}
` : '';

        const productList = products.map((p, i) =>
            `${i + 1}. ${p.name}: Current Stock = ${p.currentStock} units, Daily Sales = ${p.dailySales || 'unknown'} units/day, Reorder Point = ${p.reorderPoint || 'not set'}`
        ).join('\n');

        const prompt = `You are an inventory management expert for a small business. Analyze this inventory data and provide forecasting recommendations.

${salesContext}

Current Inventory Status:
${productList}

Forecast Timeframe: ${timeframe || '30 days'}

Provide for EACH product:
1. **Estimated Stock Duration** – how many days will current stock last
2. **Recommended Reorder Quantity** – how much to order
3. **Reorder Date** – when to place the next order
4. **Risk Level** – 🔴 Critical / 🟡 Warning / 🟢 Safe

Then provide:
**Overall Inventory Health** summary
**Top Priority Actions** – 3 immediate steps

Be specific with numbers. Format clearly with product headers.`;

        const forecast = await callGemini(prompt);
        res.json({ forecast });
    } catch (error) {
        console.error('Inventory forecast error:', error);
        res.status(500).json({ error: 'Failed to generate inventory forecast. Please check your Gemini API key.' });
    }
};

// POST /api/chat
exports.handleBusinessChat = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) return res.status(400).json({ error: 'Message is required.' });

        const session = sessionStore.get(SESSION_KEY);
        let context = '';

        if (session && session.kpis) {
            const topProducts = session.kpis.topProducts.slice(0, 5).map(p => `${p.name}: $${p.revenue}`).join(', ');
            context = `
You have access to this business's sales data:
- File: ${session.filename}
- Total Revenue: $${session.kpis.totalRevenue}
- Total Transactions: ${session.kpis.totalTransactions}
- Monthly Growth: ${session.kpis.growthPercent}%
- Top Products: ${topProducts}
- Monthly Trend: ${session.kpis.monthlyTrend.slice(-3).map(m => `${m.month}: $${m.revenue}`).join(', ')}
`;
        } else {
            context = 'No sales data has been uploaded yet. You can still answer general business questions.';
        }

        const conversationHistory = (history || [])
            .slice(-6)
            .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
            .join('\n');

        const prompt = `You are a friendly, expert AI Business Assistant for a small business. Answer questions clearly and helpfully.

${context}

${conversationHistory ? `Recent conversation:\n${conversationHistory}\n` : ''}

User: ${message}

Provide a helpful, concise answer. If sales data is available, reference specific numbers. Use emojis sparingly to make responses friendly.`;

        const reply = await callGemini(prompt);
        res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process message. Please check your Gemini API key.' });
    }
};

// POST /api/generate-report
exports.generateReport = async (req, res) => {
    try {
        const { businessName, reportType, period } = req.body;
        const session = sessionStore.get(SESSION_KEY);

        const kpis = session && session.kpis;
        const name = businessName || 'Your Business';
        const type = reportType || 'Monthly Performance';
        const reportPeriod = period || 'Current Period';

        let dataSection = '';
        if (kpis) {
            dataSection = `
Sales Data Available:
- Total Revenue: $${kpis.totalRevenue}
- Total Transactions: ${kpis.totalTransactions}
- Monthly Growth: ${kpis.growthPercent}%
- Top Products: ${kpis.topProducts.slice(0, 5).map(p => `${p.name} ($${p.revenue})`).join(', ')}
- Monthly Trend: ${kpis.monthlyTrend.map(m => `${m.month}: $${m.revenue}`).join(', ')}
`;
        } else {
            dataSection = 'No specific sales data uploaded. Generate a general business performance report template.';
        }

        const prompt = `Generate a professional ${type} Business Intelligence Report for "${name}" covering ${reportPeriod}.

${dataSection}

Format the report as follows:

# ${type} Report – ${name}
**Period:** ${reportPeriod}
**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## Executive Summary
[2-3 sentence overview of business performance]

## Key Performance Indicators
[Table-style summary of main metrics]

## Revenue Analysis
[Detailed breakdown with insights]

## Product Performance
[Top and bottom performers]

## Trend Analysis
[Month-over-month patterns and observations]

## Opportunities & Recommendations
[3-5 actionable recommendations with expected impact]

## Risk Assessment
[Key risks and mitigation strategies]

## Action Plan – Next 30 Days
[Prioritized list of actions with owners and deadlines]

---
*Report generated by AI Business Assistant*

Make the report professional, data-driven, and specific. Include actual numbers where available.`;

        const report = await callGemini(prompt);
        res.json({ report, businessName: name, reportType: type, period: reportPeriod, generatedAt: new Date().toISOString() });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: 'Failed to generate report. Please check your Gemini API key.' });
    }
};
