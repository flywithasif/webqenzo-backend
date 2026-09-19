const express = require("express");
const { body } = require("express-validator");

const {
  login,
  getMe,
  getDashboard,

  getQuotes,
  getDeletedQuotes,
  createQuote,
  updateQuoteStatus,
  addQuoteComment,
  assignQuote,
  deleteQuote,
  restoreQuote,

  getContacts,
  getDeletedContacts,
  updateContactStatus,
  addContactComment,
  deleteContact,
  restoreContact,

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

// ======================================================
// LOGIN
// ======================================================

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

// ======================================================
// AUTH
// ======================================================

router.get(
  "/me",
  protect,
  getMe
);

router.get(
  "/dashboard",
  protect,
  getDashboard
);

// ======================================================
// QUOTES / LEADS
// ======================================================

// Active leads
router.get(
  "/quotes",
  protect,
  requirePermission("quotes:read"),
  getQuotes
);

// Deleted leads - SUPER ADMIN ONLY
router.get(
  "/quotes/deleted",
  protect,
  requireSuperAdmin,
  getDeletedQuotes
);

// Manual lead creation
router.post(
  "/quotes",
  protect,
  requirePermission("quotes:create"),
  [
    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("Full name is required")
      .isLength({
        min: 2,
        max: 100,
      })
      .withMessage(
        "Full name must be between 2 and 100 characters"
      ),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email"),

    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .matches(/^[6-9]\d{9}$/)
      .withMessage(
        "Please enter a valid 10-digit Indian mobile number"
      ),

    body("company")
      .optional({
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 100,
      })
      .withMessage(
        "Company cannot exceed 100 characters"
      ),

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
      .optional({
        checkFalsy: true,
      })
      .trim()
      .isURL({
        protocols: ["http", "https"],
      })
      .withMessage(
        "Please enter a valid website URL"
      ),

    body("projectDescription")
      .trim()
      .notEmpty()
      .withMessage(
        "Project description is required"
      )
      .isLength({
        min: 10,
        max: 3000,
      })
      .withMessage(
        "Project description must be between 10 and 3000 characters"
      ),

    body("assignedTo")
      .optional({
        checkFalsy: true,
      })
      .isMongoId()
      .withMessage(
        "Invalid assigned team member"
      ),
  ],
  validate,
  createQuote
);

// Status
router.patch(
  "/quotes/:id/status",
  protect,
  requirePermission("quotes:update"),
  [
    body("status")
      .notEmpty()
      .withMessage("Status is required"),
  ],
  validate,
  updateQuoteStatus
);

// Conversation
router.post(
  "/quotes/:id/comments",
  protect,
  requirePermission("quotes:update"),
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Conversation message is required")
      .isLength({
        max: 3000,
      })
      .withMessage(
        "Conversation message cannot exceed 3000 characters"
      ),
  ],
  validate,
  addQuoteComment
);

// Assign / unassign
// SUPER ADMIN ONLY
router.patch(
  "/quotes/:id/assign",
  protect,
  requireSuperAdmin,
  [
    body("assignedTo")
      .optional({
        checkFalsy: true,
      })
      .isMongoId()
      .withMessage(
        "Invalid team member ID"
      ),
  ],
  validate,
  assignQuote
);

// Soft delete
router.delete(
  "/quotes/:id",
  protect,
  requirePermission("quotes:delete"),
  deleteQuote
);

// Restore
// SUPER ADMIN ONLY
router.patch(
  "/quotes/:id/restore",
  protect,
  requireSuperAdmin,
  restoreQuote
);

// ======================================================
// CONTACTS
// ======================================================

// Active contacts
router.get(
  "/contacts",
  protect,
  requireSuperAdmin,
  getContacts
);

// Deleted contacts
router.get(
  "/contacts/deleted",
  protect,
  requireSuperAdmin,
  getDeletedContacts
);

// Status
router.patch(
  "/contacts/:id/status",
  protect,
  requireSuperAdmin,
  [
    body("status")
      .notEmpty()
      .withMessage("Status is required"),
  ],
  validate,
  updateContactStatus
);

// Conversation
router.post(
  "/contacts/:id/comments",
  protect,
  requireSuperAdmin,
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage(
        "Conversation message is required"
      )
      .isLength({
        max: 3000,
      })
      .withMessage(
        "Conversation message cannot exceed 3000 characters"
      ),
  ],
  validate,
  addContactComment
);

// Soft delete
router.delete(
  "/contacts/:id",
  protect,
  requireSuperAdmin,
  deleteContact
);

// Restore
router.patch(
  "/contacts/:id/restore",
  protect,
  requireSuperAdmin,
  restoreContact
);

// ======================================================
// TEAM MANAGEMENT
// SUPER ADMIN ONLY
// ======================================================

router.post(
  "/team",
  protect,
  requireSuperAdmin,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({
        min: 2,
        max: 100,
      })
      .withMessage(
        "Name must be between 2 and 100 characters"
      ),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage(
        "Please enter a valid email"
      ),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({
        min: 8,
      })
      .withMessage(
        "Password must be at least 8 characters"
      ),

    body("permissions")
      .optional()
      .isArray()
      .withMessage(
        "Permissions must be an array"
      ),
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
      .withMessage(
        "Permissions must be an array"
      ),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be boolean"
      ),
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
