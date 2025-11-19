const mongoose = require('mongoose');

const RepairRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  product: { type: String, required: true },
  issue: { type: String, required: true },
  serviceType: { type: String, default: null },
  status: { type: String, default: 'pending' },
  payment: { type: String, enum: ['payment-pending', 'processing', 'paid'], default: 'payment-pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Keep updatedAt current on save
RepairRequestSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.RepairRequest || mongoose.model('RepairRequest', RepairRequestSchema);
