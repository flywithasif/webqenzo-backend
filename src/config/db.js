const mongoose = require("mongoose");

const connectDB = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If another connection attempt is already running,
  // wait for it instead of returning an unready connection.
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      const onConnected = () => {
        cleanup();
        resolve();
      };

      const onError = (error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        mongoose.connection.off("connected", onConnected);
        mongoose.connection.off("error", onError);
        mongoose.connection.off("disconnected", onError);
      };

      mongoose.connection.once("connected", onConnected);
      mongoose.connection.once("error", onError);
      mongoose.connection.once("disconnected", onError);
    });

    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
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