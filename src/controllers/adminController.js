const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const Quote = require("../models/Quote");
const Contact = require("../models/Contact");

const asyncHandler = require("../middleware/asyncHandler");
const generateToken = require("../utils/generateToken");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (!admin.isActive) {
    return res.status(403).json({
      success: false,
      message: "Admin account is disabled",
    });
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);

  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = generateToken(admin._id);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      permissions: req.admin.permissions,
      isActive: req.admin.isActive,
    },
  });
});

const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalQuotes,
    newQuotes,
    totalContacts,
    newContacts,
  ] = await Promise.all([
    Quote.countDocuments(),
    Quote.countDocuments({ status: "new" }),
    Contact.countDocuments(),
    Contact.countDocuments({ status: "new" }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      quotes: {
        total: totalQuotes,
        new: newQuotes,
      },
      contacts: {
        total: totalContacts,
        new: newContacts,
      },
    },
  });
});

const getQuotes = asyncHandler(async (req, res) => {
  const quotes = await Quote.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: quotes.length,
    data: quotes,
  });
});

const getContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

const updateQuoteStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    "new",
    "contacted",
    "in-progress",
    "completed",
    "closed",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid quote status",
    });
  }

  const quote = await Quote.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!quote) {
    return res.status(404).json({
      success: false,
      message: "Quote not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Quote status updated",
    data: quote,
  });
});

const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    "new",
    "read",
    "replied",
    "closed",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid contact status",
    });
  }

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Contact status updated",
    data: contact,
  });
});

const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findByIdAndDelete(req.params.id);

  if (!quote) {
    return res.status(404).json({
      success: false,
      message: "Quote not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Quote deleted successfully",
  });
});

const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Contact deleted successfully",
  });
});

const createTeamMember = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    permissions = [],
  } = req.body;

  const existingAdmin = await Admin.findOne({
    email: email.toLowerCase().trim(),
  });

  if (existingAdmin) {
    return res.status(409).json({
      success: false,
      message: "An admin with this email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const teamMember = await Admin.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: "TEAM_ADMIN",
    permissions,
  });

  res.status(201).json({
    success: true,
    message: "Team member created successfully",
    data: {
      id: teamMember._id,
      name: teamMember.name,
      email: teamMember.email,
      role: teamMember.role,
      permissions: teamMember.permissions,
    },
  });
});

const getTeamMembers = asyncHandler(async (req, res) => {
  const team = await Admin.find({
    role: "TEAM_ADMIN",
  }).select("-password");

  res.status(200).json({
    success: true,
    count: team.length,
    data: team,
  });
});

const updateTeamMember = asyncHandler(async (req, res) => {
  const { name, permissions, isActive } = req.body;

  const teamMember = await Admin.findOne({
    _id: req.params.id,
    role: "TEAM_ADMIN",
  });

  if (!teamMember) {
    return res.status(404).json({
      success: false,
      message: "Team member not found",
    });
  }

  if (name !== undefined) teamMember.name = name;
  if (permissions !== undefined) teamMember.permissions = permissions;
  if (isActive !== undefined) teamMember.isActive = isActive;

  await teamMember.save();

  res.status(200).json({
    success: true,
    message: "Team member updated successfully",
    data: {
      id: teamMember._id,
      name: teamMember.name,
      email: teamMember.email,
      role: teamMember.role,
      permissions: teamMember.permissions,
      isActive: teamMember.isActive,
    },
  });
});

const deleteTeamMember = asyncHandler(async (req, res) => {
  const teamMember = await Admin.findOneAndDelete({
    _id: req.params.id,
    role: "TEAM_ADMIN",
  });

  if (!teamMember) {
    return res.status(404).json({
      success: false,
      message: "Team member not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Team member deleted successfully",
  });
});

module.exports = {
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
};