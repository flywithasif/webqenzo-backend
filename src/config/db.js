const mongoose = require("mongoose");

const connectDB = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Connection is currently being established
  if (mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );

    return connection.connection;
  } catch (error) {
    console.error(
      `MongoDB Connection Error: ${error.message}`
    );

    throw error;
  }
};

module.exports = connectDB;