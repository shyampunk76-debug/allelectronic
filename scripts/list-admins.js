/**
 * Script to list all admin users and verify credentials
 * Usage: node scripts/list-admins.js [username] [password]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');

async function listAdmins() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 Database:', uri.split('/').pop().split('?')[0]);
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // List all admin users
    const users = await AdminUser.find({});
    
    if (users.length === 0) {
      console.log('⚠️  No admin users found in database\n');
      console.log('💡 Run: node scripts/create-admin.js to create admin users');
    } else {
      console.log(`📋 Found ${users.length} admin user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Test credentials if provided
    const [,, testUsername, testPassword] = process.argv;
    if (testUsername && testPassword) {
      console.log(`🔐 Testing credentials for: ${testUsername}`);
      const user = await AdminUser.findOne({ username: testUsername, isActive: true });
      
      if (!user) {
        console.log('❌ User not found or not active');
      } else if (user.password !== testPassword) {
        console.log('❌ Password mismatch');
        console.log(`   Expected: ${user.password}`);
        console.log(`   Provided: ${testPassword}`);
      } else {
        console.log('✅ Credentials are correct!');
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

listAdmins();
