const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Page routes
const servePage = (fileName) => (req, res) => {
    res.sendFile(`pages/${fileName}`, { root: path.join(__dirname, 'public') }, (err) => {
        if (err) {
            console.error(`❌ Error serving ${fileName}:`);
            console.error(err);
            if (!res.headersSent) {
                res.status(err.status || 500).send(`Error: ${err.message}`);
            }
        }
    });
};

app.get('/', servePage('index.html'));
app.get('/dashboard', servePage('dashboard.html'));
app.get('/chat', servePage('chat.html'));
app.get('/inventory', servePage('inventory.html'));
app.get('/reports', servePage('reports.html'));

// Import API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// MongoDB connection (optional)
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
}

app.listen(PORT, () => {
    console.log(`\n🚀 AI Business Assistant running at: http://localhost:${PORT}\n`);
});
