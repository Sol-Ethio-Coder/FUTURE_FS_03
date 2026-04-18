const mongoose = require('mongoose');

// Contact form schema
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
        enum: ['Math Tutoring', 'Science Tutoring', 'Coding Academy', 'Test Prep'],
        required: true
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

// Booking schema
const bookingSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true
    },
    parentName: {
        type: String,
        required: true
    },
    parentEmail: {
        type: String,
        required: true
    },
    parentPhone: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true
    },
    grade: {
        type: String,
        enum: ['4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
        required: true
    },
    preferredDate: {
        type: Date,
        required: true
    },
    preferredTime: {
        type: String,
        required: true
    },
    additionalInfo: String,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Newsletter subscriber schema
const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = {
    Contact: mongoose.model('Contact', contactSchema),
    Booking: mongoose.model('Booking', bookingSchema),
    Subscriber: mongoose.model('Subscriber', subscriberSchema)
};