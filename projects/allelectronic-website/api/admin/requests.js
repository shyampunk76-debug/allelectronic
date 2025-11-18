const connectDB = require('../../db');
const mongoose = require('mongoose');
const RepairRequestModel = require('../../models/RepairRequest');
const verifyAuth = require('../middleware/auth');


async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify JWT token
  try {
    // Ensure DB connection attempt before proceeding
    try {
      await connectDB();
    } catch (e) {
      // connectDB already logs
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) throw new Error('Missing token');
    
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    jwt.verify(token, secret);
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: ' + err.message });
  }

  const { page = 1, limit = 50, search } = req.body || {};
  const skip = (page - 1) * limit;

  try {
    console.log('admin/requests: mongoose connection state =', mongoose.connection && mongoose.connection.readyState);
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const query = search ? { $or: [ { id: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } } ] } : {};
      const results = await RepairRequestModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
      const total = await RepairRequestModel.countDocuments(query);
      return res.json({ status: 'success', data: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }
    return res.json({ status: 'success', data: [], pagination: { page, limit, total: 0, pages: 0 } });
  } catch (err) {
    console.error('admin/requests error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to read requests' });
  }
}

module.exports = handler;
