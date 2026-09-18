require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Cache MongoDB connection across warm Vercel invocations
global.mongoConnectionPromise =
  global.mongoConnectionPromise || null;

const startDatabase = async () => {
  if (!global.mongoConnectionPromise) {
    global.mongoConnectionPromise = connectDB().catch((error) => {
      // Clear failed promise so the next request can retry
      global.mongoConnectionPromise = null;
      throw error;
    });
  }

  return global.mongoConnectionPromise;
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