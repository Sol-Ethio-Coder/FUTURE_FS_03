const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log('Testing connection...');
console.log('URI starts with:', uri.substring(0, 50));

mongoose.connect(uri)
    .then(() => {
        console.log('✅ CONNECTED TO MONGODB ATLAS!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });