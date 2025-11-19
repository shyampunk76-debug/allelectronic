module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ status: 'ok', message: 'All Electronic API (health) - function OK', timestamp: new Date().toISOString() }));
};
