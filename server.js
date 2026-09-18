require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Cache the MongoDB connection promise across
// warm Vercel serverless invocations.
const globalForDB = globalThis;

const startDatabase = async () => {
  if (!globalForDB.mongoConnectionPromise) {
    globalForDB.mongoConnectionPromise = connectDB().catch((error) => {
      // Allow the next request to retry after a failed connection.
      globalForDB.mongoConnectionPromise = null;
      throw error;
    });
  }

  return globalForDB.mongoConnectionPromise;
};

// Vercel / Production
module.exports = async (req, res) => {
  try {
    await startDatabase();

    return app(req, res);
  } catch (error) {
    console.error("Database connection failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
};

// Local development
if (require.main === module) {
  startDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `WebQenzo API running on port ${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error(
        `Failed to start server: ${error.message}`
      );

      process.exit(1);
    });
}