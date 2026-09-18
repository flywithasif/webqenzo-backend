const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    isConnected = connection.connection.readyState === 1;

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );
  } catch (error) {
    isConnected = false;

    console.error(
      "MongoDB Connection Error:",
      error.message
    );

    throw error;
  }
};

module.exports = connectDB;