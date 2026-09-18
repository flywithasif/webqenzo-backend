const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  // Already connected
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Create connection promise only once
  if (!cached.promise) {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongoose) => {
        console.log("MongoDB CONNECTED");
        console.log(
          "MongoDB readyState:",
          mongoose.connection.readyState
        );

        return mongoose;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(
          "MongoDB connection failed:",
          error.message
        );

        throw error;
      });
  }

  cached.conn = await cached.promise;

  return cached.conn;
};

module.exports = connectDB;