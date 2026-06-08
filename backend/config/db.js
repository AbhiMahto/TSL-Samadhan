const mongoose = require('mongoose');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI;
  if (!connUri) {
    console.error('CRITICAL: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  const options = {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  let retries = 5;
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(connUri, options);
      console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
      break;
    } catch (err) {
      retries -= 1;
      console.error(`MongoDB connection failed. Retries left: ${retries}. Error: ${err.message}`);
      if (retries === 0) {
        console.error('CRITICAL: Could not connect to MongoDB. Exiting...');
        process.exit(1);
      }
      // Wait for 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
