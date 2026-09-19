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

const contactSchema = new mongoose.Schema(
  {
    // ================================
    // ORIGINAL CONTACT FORM FIELDS
    // ================================

    name: {
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

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: [
        "new",
        "read",
        "replied",
        "closed",
      ],
      default: "new",
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

    auditLog: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contact", contactSchema);
