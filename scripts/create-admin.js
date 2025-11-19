/**
 * Script to create admin users in MongoDB
 * Usage: node scripts/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');

// Admin users to create
const adminUsers = [
  {
    username: 'admin',
    password: 'Admin@2025',
    email: 'admin@allelectronic.com',
    role: 'admin',
    isActive: true
  },
  {
    username: 'shyampunk76',
    password: 'SecurePass123!',
    email: 'shyampunk76@allelectronic.com',
    role: 'admin',
    isActive: true
  }
];

async function createAdminUsers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI_NEW || process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI_NEW or MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Create admin users
    for (const userData of adminUsers) {
      try {
        // Check if user already exists
        const existing = await AdminUser.findOne({ username: userData.username });
        
        if (existing) {
          console.log(`⚠️  User "${userData.username}" already exists, skipping...`);
          continue;
        }

        // Create new admin user
        const user = new AdminUser(userData);
        await user.save();
        console.log(`✅ Created admin user: ${userData.username} (${userData.email})`);
      } catch (err) {
        console.error(`❌ Error creating user "${userData.username}":`, err.message);
      }
    }

    console.log('\n✅ Admin user creation completed!');
    console.log('\n📋 Summary:');
    const allUsers = await AdminUser.find({});
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.isActive}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createAdminUsers();
