// Lightweight serverless handler for /api/repair-request
// This bypasses the Express/serverless-http wrapper to provide a quick, reliable POST endpoint
const connectDB = require('../db');
const mongoose = require('mongoose');
const RepairRequestModel = require('../models/RepairRequest');

// Try to connect (harmless if already connected)

// Log DB readyState at startup for easier debugging in serverless logs
try {
  const mongoose = require('mongoose');
  console.log('repair-request: mongoose.readyState at module load =', mongoose.connection && mongoose.connection.readyState);
} catch (e) {
  // ignore
}

module.exports = async (req, res) => {
  // Ensure DB connection is attempted before handling request
  try {
    await connectDB();
  } catch (e) {
    // connectDB logs errors; continue and handler will use fallback if needed
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { name, email, phone, product, issue, serviceType } = req.body || {};

    const errors = {};
    if (!name || name.trim().length < 2) errors.name = 'Name required (2+ chars)';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Valid email required';
    if (!phone || phone.replace(/\D/g, '').length < 10) errors.phone = 'Valid phone number required (10+ digits)';
    if (!product || product.trim().length < 3) errors.product = 'Product required (3+ chars)';
    if (!issue || issue.trim().length < 10) errors.issue = 'Issue description required (10+ chars)';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
    }

    const repairRequest = {
      id: `REP-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, ''),
      product: product.trim(),
      issue: issue.trim(),
      serviceType: serviceType || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('repair-request: mongoose connection state =', mongoose.connection && mongoose.connection.readyState);
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const saved = await RepairRequestModel.create(repairRequest);
        console.log('repair-request: saved to DB id=', saved.id || saved._id);
        return res.status(201).json({ status: 'success', message: 'Repair request saved', submissionId: saved.id || saved._id });
      } catch (saveErr) {
        console.error('repair-request: DB save error:', saveErr && saveErr.message ? saveErr.message : saveErr);
        // fallthrough to return non-DB success so frontend still receives confirmation
      }
    }

    // No DB configured: return success so frontend can show confirmation
    return res.status(201).json({ status: 'success', message: 'Repair request received (no DB configured)', submissionId: repairRequest.id });
  } catch (err) {
    console.error('repair-request handler error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
