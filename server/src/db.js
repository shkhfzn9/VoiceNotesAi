const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI ;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[MongoDB] Connected:', uri);
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
