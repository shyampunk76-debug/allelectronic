const connectDB = require('../../db');
const mongoose = require('mongoose');
const RepairRequestModel = require('../../models/RepairRequest');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Verify JWT token and check admin role
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) throw new Error('Missing token');

    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    const decoded = jwt.verify(token, secret);
    
    // Check if user has admin role
    if (decoded.role !== 'admin') {
      console.log('Delete attempt by non-admin user:', decoded.username, 'role:', decoded.role);
      return res.status(403).json({ 
        status: 'error', 
        message: 'Permission denied. Only admin users can delete requests.' 
      });
    }
    
    console.log('Delete request authorized for admin:', decoded.username);
  } catch (err) {
    console.error('delete-requests auth error:', err);
    return res.status(401).json({ status: 'error', message: 'Unauthorized: ' + err.message });
  }

  // Attempt DB connection
  try {
    await connectDB();
    
    // Wait for connection to be ready
    let retries = 0;
    while (mongoose.connection.readyState !== 1 && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    console.log('delete-requests: DB connection state:', mongoose.connection.readyState);
  } catch (e) {
    console.error('delete-requests: DB connection error:', e);
  }

  const { ids } = req.body || {};
  console.log('delete-requests: Received IDs to delete:', ids);
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No IDs provided' });
  }

  try {
    // Check if database is connected
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.error('delete-requests: DB not connected, readyState:', mongoose.connection?.readyState);
      return res.status(500).json({ status: 'error', message: 'Database not available' });
    }

    // Delete the requests
    const result = await RepairRequestModel.deleteMany({ id: { $in: ids } });
    
    console.log('delete-requests: Delete result:', result);
    
    return res.status(200).json({ 
      status: 'success', 
      message: `Deleted ${result.deletedCount} request(s)`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('delete-requests error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error: ' + err.message });
  }
};
