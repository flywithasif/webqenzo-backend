require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

let dbPromise;

const startDatabase = async () => {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  return dbPromise;
};

// Vercel / production request handler
module.exports = async (req, res) => {
  await startDatabase();
  return app(req, res);
};

// Local development
if (require.main === module) {
  startDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`WebQenzo API running on port ${PORT}`);
    });
  });
}