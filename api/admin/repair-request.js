const connectDB = require('../../db');
const mongoose = require('mongoose');
const RepairRequestModel = require('../../models/RepairRequest');

connectDB().catch(() => {});

module.exports = async (req, res) => {
  // Ensure DB connection is attempted before handling
  try {
    await connectDB();
    
    // Wait for connection to be ready
    let retries = 0;
    while (mongoose.connection.readyState !== 1 && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
  } catch (e) {
    // logged in connectDB
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify JWT token
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) throw new Error('Missing token');
    
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    jwt.verify(token, secret);
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: ' + err.message });
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const request = await RepairRequestModel.findOne({ id }).lean();
      if (!request) return res.status(404).json({ status: 'error', message: 'Not found' });
      return res.json({ status: 'success', data: request });
    }
    return res.status(404).json({ status: 'error', message: 'Not found' });
  } catch (err) {
    console.error('admin/repair-request error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
