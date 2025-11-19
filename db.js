const mongoose = require('mongoose');

// Cache the database connection for serverless
let cachedConnection = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI_NEW || process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log('No MONGODB_URI provided. Running without database (in-memory fallback).');
    return null;
  }

  // Return cached connection if already connected
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    // Connect and expose mongoose instance for callers to inspect connection state
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
    console.log('Mongoose connection readyState:', mongoose.connection.readyState);
    
    cachedConnection = mongoose;
    return mongoose;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err && err.message ? err.message : err);
    console.error('Mongoose connection readyState after failure:', mongoose.connection && mongoose.connection.readyState);
    cachedConnection = null;
    return null;
  }
};

module.exports = connectDB;

// Also export current mongoose instance for modules that want to check connection state
module.exports.mongoose = mongoose;
