const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log('No MONGODB_URI provided. Running without database (in-memory fallback).');
    return null;
  }

  try {
    // Connect and expose mongoose instance for callers to inspect connection state
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    console.log('Mongoose connection readyState:', mongoose.connection.readyState);
    return mongoose;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err && err.message ? err.message : err);
    console.error('Mongoose connection readyState after failure:', mongoose.connection && mongoose.connection.readyState);
    return null;
  }
};

module.exports = connectDB;

// Also export current mongoose instance for modules that want to check connection state
module.exports.mongoose = mongoose;
