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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sol_tutoring';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ============ SCHEMAS ============
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    service: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    parentName: { type: String, required: true },
    parentEmail: { type: String, required: true },
    parentPhone: { type: String, required: true },
    service: { type: String, required: true },
    grade: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    additionalInfo: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'MongoDB',
        timestamp: new Date() 
    });
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        
        if (!name || !email || !phone || !service || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const newContact = new Contact({ name, email, phone, service, message });
        await newContact.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully! We will contact you within 24 hours.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Submit booking
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).json({ 
            success: true, 
            message: 'Booking request submitted!',
            bookingId: booking._id 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Subscribe to newsletter
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already subscribed!' });
        }
        
        const subscriber = new Subscriber({ email });
        await subscriber.save();
        
        res.status(201).json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all contacts (Admin view)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all bookings (Admin view)
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin dashboard
app.get('/admin', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 }).limit(10);
        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(10);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Dashboard - Sol Academy</title>
                <style>
                    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
                    h1 { color: #0f3460; }
                    table { width: 100%; background: white; border-collapse: collapse; margin-bottom: 30px; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #0f3460; color: white; }
                    .section { background: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
                </style>
            </head>
            <body>
                <h1>📊 Sol Academy Admin Dashboard</h1>
                <div class="section">
                    <h2>📬 Recent Contacts (${contacts.length})</h2>
                    <table>
                        <tr><th>Name</th><th>Email</th><th>Service</th><th>Date</th><th>Status</th></tr>
                        ${contacts.map(c => `
                            <tr>
                                <td>${c.name}</td>
                                <td>${c.email}</td>
                                <td>${c.service}</td>
                                <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                                <td>${c.status}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                <div class="section">
                    <h2>📅 Recent Bookings (${bookings.length})</h2>
                    <table>
                        <tr><th>Student</th><th>Parent</th><th>Service</th><th>Date</th><th>Status</th></tr>
                        ${bookings.map(b => `
                            <tr>
                                <td>${b.studentName}</td>
                                <td>${b.parentName}</td>
                                <td>${b.service}</td>
                                <td>${new Date(b.preferredDate).toLocaleDateString()}</td>
                                <td>${b.status}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error loading admin dashboard');
    }
});

// ============ FIXED: Serve frontend (NO '*' wildcard) ============
// This serves the main page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// This catches all other non-API routes (without using '*')
app.use((req, res) => {
    // Only handle non-API routes
    if (!req.path.startsWith('/api/') && req.path !== '/admin') {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 Server running on http://localhost:${PORT}
    📊 Admin dashboard: http://localhost:${PORT}/admin
    💾 Database: ${MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas'}
    `);
});