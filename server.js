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
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    service: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const subscriberSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    subscribedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// Helper function to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: 'MongoDB Atlas',
        timestamp: new Date()
    });
});

// CONTACT FORM - POST endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        
        console.log('📬 Received contact submission:', { name, email, service });
        
        // Validation
        if (!name || !email || !phone || !service || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Save to database
        const contact = new Contact({ name, email, phone, service, message });
        await contact.save();
        
        console.log(`✅ Contact saved: ${name} (${email})`);
        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully! We will contact you within 24 hours.' 
        });
    } catch (error) {
        console.error('❌ Contact error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Newsletter subscribe
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Already subscribed' });
        }
        
        await Subscriber.create({ email });
        console.log(`📧 New subscriber: ${email}`);
        res.status(201).json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all contacts (admin)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        console.log(`📋 Retrieved ${contacts.length} contacts`);
        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all subscribers (admin)
app.get('/api/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
        console.log(`📋 Retrieved ${subscribers.length} subscribers`);
        res.json(subscribers);
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin dashboard - COMPLETE VERSION
app.get('/admin', async (req, res) => {
    try {
        const contacts = await Contact.find({}).sort({ createdAt: -1 }).limit(50);
        const subscribers = await Subscriber.find({}).sort({ subscribedAt: -1 }).limit(50);
        
        console.log(`📊 Admin dashboard: ${contacts.length} contacts, ${subscribers.length} subscribers`);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Dashboard - Sol Academy</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
                    .container { max-width: 1200px; margin: 0 auto; }
                    h1 { color: #0f3460; margin-bottom: 10px; }
                    .subtitle { color: #666; margin-bottom: 30px; }
                    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .stat-card { background: linear-gradient(135deg, #0f3460, #16213e); color: white; padding: 20px; border-radius: 15px; text-align: center; }
                    .stat-number { font-size: 2rem; font-weight: bold; color: #f9a826; }
                    .stat-label { font-size: 0.9rem; opacity: 0.9; }
                    .section { background: white; padding: 20px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .section h2 { color: #0f3460; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f9a826; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #0f3460; color: white; font-weight: 600; }
                    tr:hover { background: #f8f9fa; }
                    .badge { display: inline-block; padding: 4px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
                    .badge-pending { background: #ffc107; color: #333; }
                    .badge-contacted { background: #17a2b8; color: white; }
                    .badge-completed { background: #28a745; color: white; }
                    .message-preview { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    @media (max-width: 768px) {
                        body { padding: 10px; }
                        th, td { padding: 8px; font-size: 12px; }
                        .stats { grid-template-columns: 1fr; }
                        .message-preview { max-width: 100px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📊 Sol Academy Admin Dashboard</h1>
                    <p class="subtitle">Last updated: ${new Date().toLocaleString()}</p>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number">${contacts.length}</div>
                            <div class="stat-label">Total Contacts</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${subscribers.length}</div>
                            <div class="stat-label">Newsletter Subscribers</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${contacts.filter(c => c.status === 'pending').length}</div>
                            <div class="stat-label">Pending Replies</div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>📬 Contact Form Submissions</h2>
                        ${contacts.length === 0 ? '<p style="color: #999; text-align: center;">No contacts yet. Submit a test message!</p>' : `
                        <div style="overflow-x: auto;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Service</th>
                                        <th>Message</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${contacts.map(c => `
                                        <tr>
                                            <td><strong>${escapeHtml(c.name)}</strong></td>
                                            <td><a href="mailto:${escapeHtml(c.email)}" style="color: #0f3460;">${escapeHtml(c.email)}</a></td>
                                            <td>${escapeHtml(c.phone)}</td>
                                            <td>${escapeHtml(c.service)}</td>
                                            <td class="message-preview" title="${escapeHtml(c.message)}">${escapeHtml(c.message.substring(0, 60))}${c.message.length > 60 ? '...' : ''}</td>
                                            <td>${new Date(c.createdAt).toLocaleString()}</td>
                                            <td><span class="badge badge-${c.status}">${c.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        `}
                    </div>
                    
                    <div class="section">
                        <h2>✉️ Newsletter Subscribers</h2>
                        ${subscribers.length === 0 ? '<p style="color: #999; text-align: center;">No subscribers yet. Add a test email!</p>' : `
                        <div style="overflow-x: auto;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Subscribed Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subscribers.map(s => `
                                        <tr>
                                            <td><a href="mailto:${escapeHtml(s.email)}" style="color: #0f3460;">${escapeHtml(s.email)}</a></td>
                                            <td>${new Date(s.subscribedAt).toLocaleString()}</td>
                                            <td><span class="badge badge-contacted">Active</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        `}
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).send(`
            <h1>Error Loading Dashboard</h1>
            <p>${error.message}</p>
            <pre>${error.stack}</pre>
        `);
    }
});

// ========== FRONTEND ROUTES ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes (must be AFTER all API routes)
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ════════════════════════════════════════
    🚀 Sol Academy Server Started!
    ════════════════════════════════════════
    📡 Server: http://localhost:${PORT}
    📊 Admin: http://localhost:${PORT}/admin
    ✅ POST /api/contact is ACTIVE
    💾 Database: MongoDB Atlas
    ════════════════════════════════════════
    `);
});