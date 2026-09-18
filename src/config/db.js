const mongoose = require("mongoose");

const globalForMongo = globalThis;

if (!globalForMongo.mongoCache) {
  globalForMongo.mongoCache = {
    conn: null,
    promise: null,
  };
}

const cache = globalForMongo.mongoCache;

const connectDB = async () => {
  // Already connected
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  // Connection is not healthy anymore
  if (mongoose.connection.readyState !== 1) {
    cache.conn = null;
  }

  // Create only one connection attempt
  if (!cache.promise) {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    cache.promise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        maxPoolSize: 10,
        minPoolSize: 0,
      })
      .then((mongooseInstance) => {
        console.log("MongoDB connected successfully");

        cache.conn = mongooseInstance.connection;

        return cache.conn;
      })
      .catch((error) => {
        console.error(
          "MongoDB connection failed:",
          error.message
        );

        // Important: allow the next request to retry
        cache.promise = null;
        cache.conn = null;

        throw error;
      });
  }

  const connection = await cache.promise;

  // Final safety check
  if (mongoose.connection.readyState !== 1) {
    cache.promise = null;
    cache.conn = null;

    throw new Error(
      `MongoDB connection is not ready. ReadyState: ${mongoose.connection.readyState}`
    );
  }

  return connection;
};

module.exports = connectDB;