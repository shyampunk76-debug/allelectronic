// User Management API - Add, Update, Delete staff users
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../../db');
const AdminUser = require('../../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET || 'ae-admin-secret-change-this';

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Connect to database
    await connectDB();

    // Verify admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Only admins can manage users
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    // GET - List all users (admin can see all)
    if (req.method === 'GET') {
      const users = await AdminUser
        .find({})
        .select('-password')
        .sort({ role: 1, username: 1 });
      
      return res.status(200).json({ 
        success: true, 
        users: users.map(u => ({
          id: u._id.toString(),
          username: u.username,
          role: u.role,
          createdAt: u.createdAt || null,
          lastModified: u.lastModified || null
        }))
      });
    }

    // POST - Add new staff user
    if (req.method === 'POST') {
      const { username, password, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Validate role
      const validRoles = ['admin', 'user'];
      const userRole = role && validRoles.includes(role) ? role : 'user';

      // Check if username already exists
      const existingUser = await AdminUser.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = new AdminUser({
        username,
        password: hashedPassword,
        role: userRole,
        createdBy: decoded.username
      });

      await newUser.save();

      return res.status(201).json({
        success: true,
        message: `${userRole === 'admin' ? 'Admin' : 'Staff'} user created successfully`,
        user: {
          id: newUser._id.toString(),
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });
    }

    // PUT - Update user password or role
    if (req.method === 'PUT') {
      const { userId, newPassword, newRole } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      if (!newPassword && !newRole) {
        return res.status(400).json({ error: 'Either newPassword or newRole must be provided' });
      }

      // Check if user exists
      const user = await AdminUser.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update fields
      if (newPassword) {
        user.password = await bcrypt.hash(newPassword, 10);
      }

      if (newRole && ['admin', 'user'].includes(newRole)) {
        user.role = newRole;
      }

      user.lastModified = new Date();
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        updated: {
          password: !!newPassword,
          role: !!newRole
        }
      });
    }

    // DELETE - Delete staff user
    if (req.method === 'DELETE') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Check if user exists
      const user = await AdminUser.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent deleting yourself
      if (user.username === decoded.username) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Delete user
      await AdminUser.findByIdAndDelete(userId);

      return res.status(200).json({
        success: true,
        message: `User "${user.username}" deleted successfully`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('User management error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
