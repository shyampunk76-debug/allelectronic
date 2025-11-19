const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { username, password } = req.body || {};
  if (!username || !password || username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASS) {
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '8h' });
    return res.json({ status: 'success', token });
  } catch (err) {
    console.error('admin/login error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
