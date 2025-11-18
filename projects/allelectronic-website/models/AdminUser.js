const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
adminUserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export model with duplicate key error handling
let AdminUser;

try {
  AdminUser = mongoose.model('AdminUser');
} catch (err) {
  if (err.name === 'OverwriteModelError') {
    AdminUser = mongoose.model('AdminUser');
  } else {
    AdminUser = mongoose.model('AdminUser', adminUserSchema);
  }
}

module.exports = AdminUser;
