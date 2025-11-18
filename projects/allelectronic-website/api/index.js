const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Import the main server logic
const mainServer = require('../server');

// Export the serverless handler directly for Vercel compatibility
module.exports = serverless(mainServer);
