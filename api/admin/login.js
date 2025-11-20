const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../../db');
const AdminUser = require('../../models/AdminUser');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectDB();

    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password required' });
    }

    console.log('Login attempt for user:', username);

    // Find admin user in database
    const adminUser = await AdminUser.findOne({ username, isActive: true });

    if (!adminUser) {
      console.log('User not found in database:', username);
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Check password using bcrypt
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    console.log('Login successful for user:', username);

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    const token = jwt.sign({ 
      username: adminUser.username, 
      role: adminUser.role,
      email: adminUser.email 
    }, secret, { expiresIn: '8h' });

    return res.status(200).json({ 
      status: 'success', 
      token,
      user: {
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (err) {
    console.error('admin/login error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error: ' + err.message });
  }
};
