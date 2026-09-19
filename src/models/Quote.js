const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    adminName: {
      type: String,
      default: "System",
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const quoteSchema = new mongoose.Schema(
  {
    // ================================
    // ORIGINAL PUBLIC FORM FIELDS
    // ================================

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    service: {
      type: String,
      required: true,
      trim: true,
    },

    budget: {
      type: String,
      required: true,
      trim: true,
    },

    timeline: {
      type: String,
      required: true,
      trim: true,
    },

    existingWebsite: {
      type: String,
      trim: true,
      default: "",
    },

    projectDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },

    // ================================
    // LEAD STATUS
    // ================================

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "in-progress",
        "completed",
        "closed",
      ],
      default: "new",
    },

    // ================================
    // LEAD ASSIGNMENT
    // ================================

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    assignedToName: {
      type: String,
      default: "",
      trim: true,
    },

    // ================================
    // SOFT DELETE
    // ================================

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    deletedByName: {
      type: String,
      default: "",
      trim: true,
    },

    // ================================
    // CRM HISTORY
    // ================================

    conversationHistory: {
      type: [historySchema],
      default: [],
    },

    statusHistory: {
      type: [historySchema],
      default: [],
    },

    assignmentHistory: {
      type: [historySchema],
      default: [],
    },

    auditLog: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quote", quoteSchema);
