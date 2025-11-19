/**
 * Check MongoDB collections
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI_NEW || process.env.MONGODB_URI);
    console.log('Connected to database:', mongoose.connection.name);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check AdminUser collection
    const AdminUser = require('../models/AdminUser');
    console.log('\n📌 AdminUser model collection name:', AdminUser.collection.name);
    
    const count = await AdminUser.countDocuments();
    console.log(`📊 AdminUser documents count: ${count}`);
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkCollections();
