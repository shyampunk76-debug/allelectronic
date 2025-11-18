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

  // Verify JWT token and ensure DB connection
  try {
    // Attempt DB connection before processing update
    const db = await connectDB();

    if (!db || (mongoose.connection && mongoose.connection.readyState !== 1)) {
      return res.status(500).json({ status: 'error', message: 'Database not configured or unavailable. Set MONGODB_URI in environment.' });
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

  const { id, status, payment } = req.body || {};
  if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });

  try {
    const update = {};
    if (status && validStatus.includes(status)) update.status = status;
    if (payment && validPayment.includes(payment)) update.payment = payment;
    update.updatedAt = new Date();

    // Ensure id is a string when searching
    const idQuery = typeof id === 'string' ? id : String(id || '');
    const updated = await RepairRequestModel.findOneAndUpdate({ id: idQuery }, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ status: 'error', message: 'Not found' });
    return res.json({ status: 'success', data: updated });
  } catch (err) {
    console.error('admin/update-status error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
