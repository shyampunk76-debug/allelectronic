const connectDB = require('../../db');
const mongoose = require('mongoose');
const RepairRequestModel = require('../../models/RepairRequest');

connectDB().catch(() => {});

const validStatus = ['pending', 'in-progress', 'completed', 'cancelled'];
const validPayment = ['payment-pending', 'processing', 'paid'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Verify JWT token and ensure DB connection
  try {
    // Attempt DB connection before processing update
    const db = await connectDB();
    console.log('update-status: DB connection state:', mongoose.connection.readyState);

    if (!db || (mongoose.connection && mongoose.connection.readyState !== 1)) {
      console.error('update-status: DB not available');
      return res.status(500).json({ status: 'error', message: 'Database not configured or unavailable. Set MONGODB_URI in environment.' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) throw new Error('Missing token');

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    jwt.verify(token, secret);
  } catch (err) {
    console.error('update-status auth error:', err);
    return res.status(401).json({ status: 'error', message: 'Unauthorized: ' + err.message });
  }

  const { id, status, payment } = req.body || {};
  console.log('update-status: Received payload:', { id, status, payment });
  
  if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });

  try {
    const update = {};
    if (status && validStatus.includes(status)) update.status = status;
    if (payment && validPayment.includes(payment)) update.payment = payment;
    update.updatedAt = new Date();

    console.log('update-status: Update fields:', update);

    // Ensure id is a string when searching
    const idQuery = typeof id === 'string' ? id : String(id || '');
    const updated = await RepairRequestModel.findOneAndUpdate({ id: idQuery }, update, { new: true }).lean();
    
    console.log('update-status: Update result:', updated ? 'success' : 'not found');
    
    if (!updated) return res.status(404).json({ status: 'error', message: 'Request not found' });
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    console.error('update-status error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error: ' + err.message });
  }
};
