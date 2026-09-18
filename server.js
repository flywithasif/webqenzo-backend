require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const handler = async (req, res) => {
  try {
    await connectDB();

    return app(req, res);
  } catch (error) {
    console.error("Database connection error:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

module.exports = handler;

if (require.main === module) {
  connectDB()
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