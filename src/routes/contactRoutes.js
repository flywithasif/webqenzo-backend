const express = require("express");
const { body } = require("express-validator");

const {
  createContact,
} = require("../controllers/contactController");

const validate = require("../middleware/validate");
const connectDB = require("../config/db");

const router = express.Router();

const contactValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage(
      "Please enter a valid 10-digit Indian mobile number"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 3, max: 200 })
    .withMessage(
      "Subject must be between 3 and 200 characters"
    ),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 3000 })
    .withMessage(
      "Message must be between 10 and 3000 characters"
    ),
];

// MongoDB connection middleware
const ensureDatabaseConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      "CONTACT DATABASE CONNECTION ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

router.post(
  "/",
  ensureDatabaseConnection,
  contactValidation,
  validate,
  createContact
);

module.exports = router;