const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // If no external MongoDB, use in-memory server for development/testing
    if (!uri || uri.includes('localhost:27017')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('Using in-memory MongoDB for development');
      } catch (err) {
        console.error('Failed to start in-memory MongoDB:', err.message);
        console.error('Please install MongoDB locally or provide a MONGODB_URI in .env');
        process.exit(1);
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
