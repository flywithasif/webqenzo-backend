const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
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

    status: {
      type: String,
      enum: ["new", "contacted", "in-progress", "completed", "closed"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quote", quoteSchema);