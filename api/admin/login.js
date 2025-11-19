const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password required' });
    }

    if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASS) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '8h' });
    return res.status(200).json({ status: 'success', token });
  } catch (err) {
    console.error('admin/login error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
