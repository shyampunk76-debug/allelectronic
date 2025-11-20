// User Management API - Add, Update, Delete staff users
import clientPromise from '../../db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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

    const client = await clientPromise;
    const db = client.db('allelectronic');
    const usersCollection = db.collection('admin_users');

    // GET - List all users (admin can see all)
    if (req.method === 'GET') {
      const users = await usersCollection
        .find({}, { projection: { password: 0 } })
        .sort({ role: 1, username: 1 })
        .toArray();
      
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
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = {
        username,
        password: hashedPassword,
        role: userRole,
        createdAt: new Date(),
        createdBy: decoded.username,
        lastModified: new Date()
      };

      const result = await usersCollection.insertOne(newUser);

      return res.status(201).json({
        success: true,
        message: `${userRole === 'admin' ? 'Admin' : 'Staff'} user created successfully`,
        user: {
          id: result.insertedId.toString(),
          username,
          role: userRole,
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

      const { ObjectId } = await import('mongodb');
      let objectId;
      try {
        objectId = new ObjectId(userId);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      // Check if user exists
      const user = await usersCollection.findOne({ _id: objectId });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prepare update object
      const updateObj = {
        lastModified: new Date(),
        modifiedBy: decoded.username
      };

      if (newPassword) {
        updateObj.password = await bcrypt.hash(newPassword, 10);
      }

      if (newRole && ['admin', 'user'].includes(newRole)) {
        updateObj.role = newRole;
      }

      // Update user
      await usersCollection.updateOne(
        { _id: objectId },
        { $set: updateObj }
      );

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

      const { ObjectId } = await import('mongodb');
      let objectId;
      try {
        objectId = new ObjectId(userId);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      // Check if user exists
      const user = await usersCollection.findOne({ _id: objectId });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent deleting yourself
      if (user.username === decoded.username) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Delete user
      await usersCollection.deleteOne({ _id: objectId });

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
}
