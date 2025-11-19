module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    status: 'ok', 
    message: 'All Electronic API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/repair-request',
      'POST /api/admin/login',
      'GET /api/admin/requests',
      'GET /api/admin/repair-request',
      'PUT /api/admin/update-status',
      'GET /api/health'
    ]
  });
};
