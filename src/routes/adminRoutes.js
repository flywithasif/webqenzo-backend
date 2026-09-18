const express = require("express");
const { body } = require("express-validator");

const {
  login,
  getMe,
  getDashboard,
  getQuotes,
  getContacts,
  updateQuoteStatus,
  updateContactStatus,
  deleteQuote,
  deleteContact,
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
} = require("../controllers/adminController");

const validate = require("../middleware/validate");

const {
  protect,
  requireSuperAdmin,
  requirePermission,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ================================
// LOGIN
// ================================

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email"),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  validate,
  login
);

// ================================
// AUTHENTICATED ROUTES
// ================================

router.get("/me", protect, getMe);

router.get(
  "/dashboard",
  protect,
  getDashboard
);

// ================================
// QUOTES
// ================================

router.get(
  "/quotes",
  protect,
  requirePermission("quotes:read"),
  getQuotes
);

router.patch(
  "/quotes/:id/status",
  protect,
  requirePermission("quotes:update"),
  updateQuoteStatus
);

router.delete(
  "/quotes/:id",
  protect,
  requirePermission("quotes:delete"),
  deleteQuote
);

// ================================
// CONTACTS
// ================================

router.get(
  "/contacts",
  protect,
  requirePermission("contacts:read"),
  getContacts
);

router.patch(
  "/contacts/:id/status",
  protect,
  requirePermission("contacts:update"),
  updateContactStatus
);

router.delete(
  "/contacts/:id",
  protect,
  requirePermission("contacts:delete"),
  deleteContact
);

// ================================
// TEAM MANAGEMENT
// SUPER ADMIN ONLY
// ================================

router.post(
  "/team",
  protect,
  requireSuperAdmin,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    body("permissions")
      .optional()
      .isArray()
      .withMessage("Permissions must be an array"),
  ],
  validate,
  createTeamMember
);

router.get(
  "/team",
  protect,
  requireSuperAdmin,
  getTeamMembers
);

router.patch(
  "/team/:id",
  protect,
  requireSuperAdmin,
  [
    body("permissions")
      .optional()
      .isArray()
      .withMessage("Permissions must be an array"),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be boolean"),
  ],
  validate,
  updateTeamMember
);

router.delete(
  "/team/:id",
  protect,
  requireSuperAdmin,
  deleteTeamMember
);

module.exports = router;