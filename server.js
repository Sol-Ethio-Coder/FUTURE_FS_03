// ========== LOAD ENVIRONMENT VARIABLES ==========
require('dotenv').config();

// ========== IMPORTS ==========
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// ========== INITIALIZE APP ==========
const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' folder

// ========== MONGODB CONNECTION ==========
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not defined in environment variables');
    console.error('Please set MONGODB_URI in your Render environment variables');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log('📍 Database:', MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// ========== DATABASE SCHEMAS ==========

// Contact Form Schema
const contactSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number is required'] 
    },
    service: { 
        type: String, 
        required: [true, 'Service selection is required'],
        enum: ['Math Tutoring', 'Science Tutoring', 'Computing Class', 'Exam Preparation', 'Game Development', 'AI & Machine Learning']
    },
    message: { 
        type: String, 
        required: [true, 'Message is required'] 
    },
    status: { 
        type: String, 
        enum: ['pending', 'contacted', 'completed'], 
        default: 'pending' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    parentName: { type: String, required: true },
    parentEmail: { type: String, required: true },
    parentPhone: { type: String, required: true },
    service: { type: String, required: true },
    grade: { 
        type: String, 
        required: true,
        enum: ['4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
    },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    additionalInfo: String,
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now }
});

// Newsletter Subscriber Schema
const subscriberSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true 
    },
    subscribedAt: { type: Date, default: Date.now }
});

// Create Models
const Contact = mongoose.model('Contact', contactSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// ========== API ROUTES ==========

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        
        // Validation
        if (!name || !email || !phone || !service || !message) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }
        
        const newContact = new Contact({ name, email, phone, service, message });
        await newContact.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully! We will contact you within 24 hours.',
            data: newContact
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            error: 'Server error. Please try again.' 
        });
    }
});

// Submit booking
app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Basic validation
        if (!bookingData.studentName || !bookingData.parentEmail) {
            return res.status(400).json({ 
                error: 'Student name and parent email are required' 
            });
        }
        
        const newBooking = new Booking(bookingData);
        await newBooking.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Booking request submitted! We will confirm within 24 hours.',
            bookingId: newBooking._id
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ 
            error: 'Server error. Please try again.' 
        });
    }
});

// Subscribe to newsletter
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Check if already subscribed
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already subscribed!' });
        }
        
        const subscriber = new Subscriber({ email });
        await subscriber.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Subscribed successfully!' 
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ 
            error: 'Server error. Please try again.' 
        });
    }
});

// Get all contacts (Admin endpoint)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all bookings (Admin endpoint)
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all subscribers (Admin endpoint)
app.get('/api/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
        res.json(subscribers);
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update contact status (Admin endpoint)
app.put('/api/contacts/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== ADMIN DASHBOARD ==========
app.get('/admin', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 }).limit(20);
        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(20);
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 }).limit(20);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Dashboard - Sol Academy</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Arial, sans-serif; 
                        background: #f5f5f5; 
                        padding: 20px;
                    }
                    h1 { color: #0f3460; margin-bottom: 10px; }
                    .stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .stat-card {
                        background: linear-gradient(135deg, #0f3460, #16213e);
                        color: white;
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                    }
                    .stat-number {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #f9a826;
                    }
                    .section {
                        background: white;
                        padding: 20px;
                        border-radius: 15px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .section h2 {
                        color: #0f3460;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #f9a826;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        overflow-x: auto;
                        display: block;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background: #0f3460;
                        color: white;
                    }
                    tr:hover {
                        background: #f8f9fa;
                    }
                    .badge {
                        display: inline-block;
                        padding: 3px 8px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                    }
                    .badge-pending { background: #ffc107; color: #333; }
                    .badge-contacted { background: #17a2b8; color: white; }
                    .badge-completed { background: #28a745; color: white; }
                    @media (max-width: 768px) {
                        th, td { padding: 8px; font-size: 12px; }
                        body { padding: 10px; }
                    }
                </style>
            </head>
            <body>
                <h1>📊 Sol Academy Admin Dashboard</h1>
                <p>Last updated: ${new Date().toLocaleString()}</p>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">${contacts.length}</div>
                        <div>Total Contacts</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${bookings.length}</div>
                        <div>Total Bookings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${subscribers.length}</div>
                        <div>Subscribers</div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>📬 Recent Contacts (${contacts.length})</h2>
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Service</th><th>Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${contacts.map(c => `
                                <tr>
                                    <td>${c.name}</td>
                                    <td>${c.email}</td>
                                    <td>${c.phone}</td>
                                    <td>${c.service}</td>
                                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                                    <td><span class="badge badge-${c.status}">${c.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h2>📅 Recent Bookings (${bookings.length})</h2>
                    <table>
                        <thead>
                            <tr><th>Student</th><th>Parent</th><th>Service</th><th>Grade</th><th>Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${bookings.map(b => `
                                <tr>
                                    <td>${b.studentName}</td>
                                    <td>${b.parentName}</td>
                                    <td>${b.service}</td>
                                    <td>${b.grade}</td>
                                    <td>${new Date(b.preferredDate).toLocaleDateString()}</td>
                                    <td><span class="badge badge-${b.status}">${b.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h2>✉️ Subscribers (${subscribers.length})</h2>
                    <table>
                        <thead><tr><th>Email</th><th>Subscribed Date</th></tr></thead>
                        <tbody>
                            ${subscribers.map(s => `
                                <tr>
                                    <td>${s.email}</td>
                                    <td>${new Date(s.subscribedAt).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).send('Error loading admin dashboard');
    }
});

// ========== SERVE FRONTEND ==========
// Serve main page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route to serve index.html for client-side routing
app.use((req, res) => {
    // Only handle non-API, non-admin routes
    if (!req.path.startsWith('/api/') && req.path !== '/admin') {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ════════════════════════════════════════
    🚀 Sol Tutoring Academy Server Started!
    ════════════════════════════════════════
    📡 Server running on: http://localhost:${PORT}
    📊 Admin dashboard: http://localhost:${PORT}/admin
    💾 Database: ${MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas'}
    ✅ Health check: http://localhost:${PORT}/api/health
    ════════════════════════════════════════
    `);
});