const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/remindr';

  // Try the real (local or external) MongoDB first, e.g. the one started
  // via `docker compose up -d` (see docker-compose.yml).
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('Could not connect to MongoDB. Set MONGODB_URI in your .env file.');
    process.exit(1);
  }

  // Fall back to an in-memory MongoDB for local development/testing when no
  // real database is reachable.
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const conn = await mongoose.connect(mongod.getUri());
    console.log(`Using in-memory MongoDB for development (data will not persist): ${conn.connection.host}`);
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err.message);
    console.error('Run `docker compose up -d` to start a local MongoDB, or set MONGODB_URI in .env');
    process.exit(1);
  }
};

module.exports = connectDB;
