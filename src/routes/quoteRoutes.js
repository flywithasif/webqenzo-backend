const express = require("express");
const { body } = require("express-validator");

const {
  createQuote,
} = require("../controllers/quoteController");

const validate = require("../middleware/validate");

const router = express.Router();

const quoteValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid 10-digit Indian mobile number"),

  body("company")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),

  body("service")
    .trim()
    .notEmpty()
    .withMessage("Service is required"),

  body("budget")
    .trim()
    .notEmpty()
    .withMessage("Budget is required"),

  body("timeline")
    .trim()
    .notEmpty()
    .withMessage("Timeline is required"),

  body("existingWebsite")
  .optional({ checkFalsy: true })
  .trim()
  .isURL({ protocols: ["http", "https"] })
  .withMessage("Please enter a valid website URL"),

  body("projectDescription")
    .trim()
    .notEmpty()
    .withMessage("Project description is required")
    .isLength({ min: 10, max: 3000 })
    .withMessage(
      "Project description must be between 10 and 3000 characters"
    ),
];

router.post("/", quoteValidation, validate, createQuote);

module.exports = router;

