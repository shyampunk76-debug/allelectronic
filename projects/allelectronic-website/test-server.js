const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Import API routes
const healthHandler = require('./api/health');
const repairRequestHandler = require('./api/repair-request');

// Health check endpoint
app.get('/api/health', healthHandler);
app.post('/api/health', healthHandler);

// Repair request endpoint
app.post('/api/repair-request', repairRequestHandler);

// Admin routes (basic setup)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    res.json({ 
      status: 'success', 
      token: 'test-token-123',
      message: 'Login successful' 
    });
  } else {
    res.status(401).json({ 
      status: 'error', 
      message: 'Invalid credentials' 
    });
  }
});

// Serve frontend files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 All Electronic Test Server running at http://localhost:${PORT}`);
  console.log(`📱 Main site: http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  
  // Display environment info
  console.log('\n📋 Environment Status:');
  console.log(`   MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not set'}`);
  console.log(`   Admin User: ${process.env.ADMIN_USER || 'Not set'}`);
  console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not set'}`);
});