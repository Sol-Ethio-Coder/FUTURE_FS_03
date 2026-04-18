require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not defined');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

// ========== SCHEMAS ==========
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    service: String,
    message: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const subscriberSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    subscribedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// ========== API ROUTES (MUST BE BEFORE CATCH-ALL) ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        
        if (!name || !email || !phone || !service || !message) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        const contact = new Contact({ name, email, phone, service, message });
        await contact.save();
        
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Newsletter subscribe
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Already subscribed' });
        }
        
        await Subscriber.create({ email });
        res.json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get contacts (admin)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get subscribers (admin)
app.get('/api/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin dashboard
app.get('/admin', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 }).limit(20);
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 }).limit(20);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Dashboard</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
                    h1 { color: #0f3460; }
                    .section { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #0f3460; color: white; }
                </style>
            </head>
            <body>
                <h1>📊 Sol Academy Admin Dashboard</h1>
                <div class="section">
                    <h2>Contacts (${contacts.length})</h2>
                    <table>
                        <tr><th>Name</th><th>Email</th><th>Service</th><th>Date</th></tr>
                        ${contacts.map(c => `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.service}</td><td>${new Date(c.createdAt).toLocaleDateString()}</td></tr>`).join('')}
                    </table>
                </div>
                <div class="section">
                    <h2>Subscribers (${subscribers.length})</h2>
                    <table>
                        <tr><th>Email</th><th>Date</th></tr>
                        ${subscribers.map(s => `<tr><td>${s.email}</td><td>${new Date(s.subscribedAt).toLocaleDateString()}</td></tr>`).join('')}
                    </table>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error loading dashboard');
    }
});

// ========== FRONTEND ROUTES (AFTER API ROUTES) ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Catch-all for frontend (only non-API routes)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin`);
});