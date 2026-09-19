const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const Quote = require("../models/Quote");
const Contact = require("../models/Contact");

const asyncHandler = require("../middleware/asyncHandler");
const generateToken = require("../utils/generateToken");

// ======================================================
// HELPERS
// ======================================================

const isSuperAdmin = (req) => {
  return req.admin?.role === "SUPER_ADMIN";
};

const getAdminInfo = (req) => ({
  adminId: req.admin?._id || null,
  adminName: req.admin?.name || "Admin",
});

const canAccessQuote = (req, quote) => {
  if (isSuperAdmin(req)) return true;

  return (
    quote.assignedTo &&
    quote.assignedTo.toString() === req.admin._id.toString()
  );
};

const canAccessContact = (req) => {
  return isSuperAdmin(req);
};

const addHistory = ({
  action,
  message,
  adminId,
  adminName,
}) => ({
  action,
  message,
  adminId: adminId || null,
  adminName: adminName || "System",
  createdAt: new Date(),
});

// ======================================================
// LOGIN
// ======================================================

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

  const passwordMatch = await bcrypt.compare(
    password,
    admin.password
  );

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

// ======================================================
// ME
// ======================================================

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

// ======================================================
// DASHBOARD
// ======================================================

const getDashboard = asyncHandler(async (req, res) => {
  const quoteFilter = isSuperAdmin(req)
    ? {
        isDeleted: {
          $ne: true,
        },
      }
    : {
        isDeleted: {
          $ne: true,
        },
        assignedTo: req.admin._id,
      };

  const contactFilter = {
    isDeleted: {
      $ne: true,
    },
  };

  const [
    totalQuotes,
    newQuotes,
    totalContacts,
    newContacts,
  ] = await Promise.all([
    Quote.countDocuments(quoteFilter),

    Quote.countDocuments({
      ...quoteFilter,
      status: "new",
    }),

    isSuperAdmin(req)
      ? Contact.countDocuments(contactFilter)
      : Contact.countDocuments({
          ...contactFilter,
          _id: null,
        }),

    isSuperAdmin(req)
      ? Contact.countDocuments({
          ...contactFilter,
          status: "new",
        })
      : 0,
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalQuotes,
        newQuotes,
        totalContacts,
        newContacts,
      },

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

// ======================================================
// GET ACTIVE QUOTES
// ======================================================

const getQuotes = asyncHandler(async (req, res) => {
  const filter = {
    isDeleted: {
      $ne: true,
    },
  };

  if (!isSuperAdmin(req)) {
    filter.assignedTo = req.admin._id;
  }

  const quotes = await Quote.find(filter)
    .sort({
      createdAt: -1,
    })
    .populate(
      "assignedTo",
      "name email role isActive"
    );

  res.status(200).json({
    success: true,
    count: quotes.length,
    data: quotes,
  });
});

// ======================================================
// GET DELETED QUOTES
// SUPER ADMIN ONLY
// ======================================================

const getDeletedQuotes = asyncHandler(async (req, res) => {
  const quotes = await Quote.find({
    isDeleted: true,
  })
    .sort({
      deletedAt: -1,
    })
    .populate(
      "assignedTo",
      "name email role isActive"
    );

  res.status(200).json({
    success: true,
    count: quotes.length,
    data: quotes,
  });
});

// ======================================================
// CREATE MANUAL LEAD
// ======================================================

const createQuote = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    company,
    service,
    budget,
    timeline,
    existingWebsite,
    projectDescription,
    assignedTo,
  } = req.body;

  let finalAssignedTo = null;
  let finalAssignedToName = "";

  // --------------------------------------------------
  // TEAM ADMIN CREATES LEAD
  // Automatically assign to himself
  // --------------------------------------------------

  if (!isSuperAdmin(req)) {
    finalAssignedTo = req.admin._id;
    finalAssignedToName = req.admin.name;
  }

  // --------------------------------------------------
  // SUPER ADMIN CAN SELECT TEAM MEMBER
  // --------------------------------------------------

  if (isSuperAdmin(req) && assignedTo) {
    const teamMember = await Admin.findOne({
      _id: assignedTo,
      role: "TEAM_ADMIN",
      isActive: true,
    });

    if (!teamMember) {
      return res.status(400).json({
        success: false,
        message: "Selected team member is invalid or inactive",
      });
    }

    finalAssignedTo = teamMember._id;
    finalAssignedToName = teamMember.name;
  }

  const adminInfo = getAdminInfo(req);

  const initialAudit = addHistory({
    action: "lead_created",
    message: isSuperAdmin(req)
      ? finalAssignedTo
        ? `Lead manually created and assigned to ${finalAssignedToName}`
        : "Lead manually created without assignment"
      : "Lead manually created by team member",
    adminId: adminInfo.adminId,
    adminName: adminInfo.adminName,
  });

  const quote = await Quote.create({
    fullName,
    email,
    phone,
    company: company || "",
    service,
    budget,
    timeline,
    existingWebsite: existingWebsite || "",
    projectDescription,

    assignedTo: finalAssignedTo,
    assignedToName: finalAssignedToName,

    isDeleted: false,

    auditLog: [initialAudit],

    assignmentHistory: finalAssignedTo
      ? [
          addHistory({
            action: "lead_assigned",
            message: `Lead assigned to ${finalAssignedToName}`,
            adminId: adminInfo.adminId,
            adminName: adminInfo.adminName,
          }),
        ]
      : [],
  });

  res.status(201).json({
    success: true,
    message: "Lead created successfully",
    data: quote,
  });
});

// ======================================================
// UPDATE QUOTE STATUS
// ======================================================

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

  const quote = await Quote.findOne({
    _id: req.params.id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!quote) {
    return res.status(404).json({
      success: false,
      message: "Quote not found",
    });
  }

  if (!canAccessQuote(req, quote)) {
    return res.status(403).json({
      success: false,
      message: "You can only manage your assigned leads",
    });
  }

  const oldStatus = quote.status;

  if (oldStatus === status) {
    return res.status(200).json({
      success: true,
      message: "Status is already set to this value",
      data: quote,
    });
  }

  const adminInfo = getAdminInfo(req);

  quote.status = status;

  quote.statusHistory.push(
    addHistory({
      action: "status_changed",
      message: `Status changed from "${oldStatus}" to "${status}"`,
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  quote.auditLog.push(
    addHistory({
      action: "status_changed",
      message: `Status changed from "${oldStatus}" to "${status}"`,
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await quote.save();

  res.status(200).json({
    success: true,
    message: "Quote status updated",
    data: quote,
  });
});

// ======================================================
// ADD QUOTE CONVERSATION
// ======================================================

const addQuoteComment = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Conversation message is required",
    });
  }

  const quote = await Quote.findOne({
    _id: req.params.id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!quote) {
    return res.status(404).json({
      success: false,
      message: "Quote not found",
    });
  }

  if (!canAccessQuote(req, quote)) {
    return res.status(403).json({
      success: false,
      message: "You can only manage your assigned leads",
    });
  }

  const adminInfo = getAdminInfo(req);

  const history = addHistory({
    action: "conversation_added",
    message: message.trim(),
    adminId: adminInfo.adminId,
    adminName: adminInfo.adminName,
  });

  quote.conversationHistory.push(history);

  quote.auditLog.push(
    addHistory({
      action: "conversation_added",
      message: "A conversation/update was added to the lead",
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await quote.save();

  res.status(201).json({
    success: true,
    message: "Conversation added successfully",
    data: quote,
  });
});

// ======================================================
// ASSIGN QUOTE
// SUPER ADMIN ONLY
// ======================================================

const assignQuote = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;

  const quote = await Quote.findOne({
    _id: req.params.id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!quote) {
    return res.status(404).json({
      success: false,
      message: "Quote not found",
    });
  }

  let teamMember = null;

  if (assignedTo) {
    teamMember = await Admin.findOne({
      _id: assignedTo,
      role: "TEAM_ADMIN",
      isActive: true,
    });

    if (!teamMember) {
      return res.status(400).json({
        success: false,
        message: "Selected team member is invalid or inactive",
      });
    }
  }

  const previousName =
    quote.assignedToName || "Unassigned";

  const newName = teamMember
    ? teamMember.name
    : "Unassigned";

  const adminInfo = getAdminInfo(req);

  quote.assignedTo = teamMember
    ? teamMember._id
    : null;

  quote.assignedToName = teamMember
    ? teamMember.name
    : "";

  quote.assignmentHistory.push(
    addHistory({
      action: teamMember
        ? "lead_assigned"
        : "lead_unassigned",
      message: teamMember
        ? `Lead assigned to ${teamMember.name} from ${previousName}`
        : `Lead unassigned from ${previousName}`,
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  quote.auditLog.push(
    addHistory({
      action: teamMember
        ? "lead_assigned"
        : "lead_unassigned",
      message: teamMember
        ? `Lead assigned to ${teamMember.name}`
        : `Lead unassigned`,
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await quote.save();

  await quote.populate(
    "assignedTo",
    "name email role isActive"
  );

  res.status(200).json({
    success: true,
    message: teamMember
      ? `Lead assigned to ${newName}`
      : "Lead unassigned successfully",
    data: quote,
  });
});

// ======================================================
// SOFT DELETE QUOTE
// ======================================================

const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({
    _id: req.params.id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!quote) {
    return res.status(404).json({
      success: false,
      message: "Quote not found",
    });
  }

  if (!canAccessQuote(req, quote)) {
    return res.status(403).json({
      success: false,
      message: "You can only manage your assigned leads",
    });
  }

  const adminInfo = getAdminInfo(req);

  quote.isDeleted = true;
  quote.deletedAt = new Date();
  quote.deletedBy = adminInfo.adminId;
  quote.deletedByName = adminInfo.adminName;

  quote.auditLog.push(
    addHistory({
      action: "lead_deleted",
      message: "Lead moved to deleted leads",
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await quote.save();

  res.status(200).json({
    success: true,
    message: "Lead moved to deleted leads",
  });
});

// ======================================================
// RESTORE QUOTE
// SUPER ADMIN ONLY
// ======================================================

const restoreQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!quote) {
    return res.status(404).json({
      success: false,
      message: "Deleted lead not found",
    });
  }

  const adminInfo = getAdminInfo(req);

  quote.isDeleted = false;
  quote.deletedAt = null;
  quote.deletedBy = null;
  quote.deletedByName = "";

  quote.auditLog.push(
    addHistory({
      action: "lead_restored",
      message: "Lead restored from deleted leads",
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await quote.save();

  res.status(200).json({
    success: true,
    message: "Lead restored successfully",
    data: quote,
  });
});

// ======================================================
// CONTACTS
// ======================================================

const getContacts = asyncHandler(async (req, res) => {
  if (!canAccessContact(req)) {
    return res.status(403).json({
      success: false,
      message: "Super Admin access required for contacts",
    });
  }

  const contacts = await Contact.find({
    isDeleted: {
      $ne: true,
    },
  }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

// ======================================================
// DELETED CONTACTS
// ======================================================

const getDeletedContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({
    isDeleted: true,
  }).sort({
    deletedAt: -1,
  });

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

// ======================================================
// UPDATE CONTACT STATUS
// ======================================================

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

  const contact = await Contact.findOne({
    _id: req.params.id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact not found",
    });
  }

  const oldStatus = contact.status;

  if (oldStatus === status) {
    return res.status(200).json({
      success: true,
      message: "Status is already set to this value",
      data: contact,
    });
  }

  const adminInfo = getAdminInfo(req);

  contact.status = status;

  contact.statusHistory.push(
    addHistory({
      action: "status_changed",
      message: `Status changed from "${oldStatus}" to "${status}"`,
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  contact.auditLog.push(
    addHistory({
      action: "status_changed",
      message: `Status changed from "${oldStatus}" to "${status}"`,
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await contact.save();

  res.status(200).json({
    success: true,
    message: "Contact status updated",
    data: contact,
  });
});

// ======================================================
// ADD CONTACT COMMENT
// ======================================================

const addContactComment = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Conversation message is required",
    });
  }

  const contact = await Contact.findOne({
    _id: req.params.id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact not found",
    });
  }

  const adminInfo = getAdminInfo(req);

  contact.conversationHistory.push(
    addHistory({
      action: "conversation_added",
      message: message.trim(),
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  contact.auditLog.push(
    addHistory({
      action: "conversation_added",
      message: "A conversation/update was added",
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await contact.save();

  res.status(201).json({
    success: true,
    message: "Conversation added successfully",
    data: contact,
  });
});

// ======================================================
// SOFT DELETE CONTACT
// ======================================================

const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact not found",
    });
  }

  const adminInfo = getAdminInfo(req);

  contact.isDeleted = true;
  contact.deletedAt = new Date();
  contact.deletedBy = adminInfo.adminId;
  contact.deletedByName = adminInfo.adminName;

  contact.auditLog.push(
    addHistory({
      action: "contact_deleted",
      message: "Contact moved to deleted contacts",
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await contact.save();

  res.status(200).json({
    success: true,
    message: "Contact moved to deleted contacts",
  });
});

// ======================================================
// RESTORE CONTACT
// ======================================================

const restoreContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Deleted contact not found",
    });
  }

  const adminInfo = getAdminInfo(req);

  contact.isDeleted = false;
  contact.deletedAt = null;
  contact.deletedBy = null;
  contact.deletedByName = "";

  contact.auditLog.push(
    addHistory({
      action: "contact_restored",
      message: "Contact restored from deleted contacts",
      adminId: adminInfo.adminId,
      adminName: adminInfo.adminName,
    })
  );

  await contact.save();

  res.status(200).json({
    success: true,
    message: "Contact restored successfully",
    data: contact,
  });
});

// ======================================================
// CREATE TEAM MEMBER
// ======================================================

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

  const hashedPassword = await bcrypt.hash(
    password,
    12
  );

  const teamMember = await Admin.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: "TEAM_ADMIN",
    permissions,
    isActive: true,
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
      isActive: teamMember.isActive,
    },
  });
});

// ======================================================
// GET TEAM MEMBERS
// ======================================================

const getTeamMembers = asyncHandler(async (req, res) => {
  const team = await Admin.find({
    role: "TEAM_ADMIN",
  })
    .select("-password")
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    count: team.length,
    data: team,
  });
});

// ======================================================
// UPDATE TEAM MEMBER
// ======================================================

const updateTeamMember = asyncHandler(async (req, res) => {
  const {
    name,
    permissions,
    isActive,
  } = req.body;

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

  if (name !== undefined) {
    teamMember.name = name;
  }

  if (permissions !== undefined) {
    teamMember.permissions = permissions;
  }

  if (isActive !== undefined) {
    teamMember.isActive = isActive;
  }

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

// ======================================================
// DELETE TEAM MEMBER
// ======================================================

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

  // Unassign all active leads belonging to this team member.
  await Quote.updateMany(
    {
      assignedTo: teamMember._id,
      isDeleted: {
        $ne: true,
      },
    },
    {
      $set: {
        assignedTo: null,
        assignedToName: "",
      },
    }
  );

  res.status(200).json({
    success: true,
    message: "Team member deleted successfully",
  });
});

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
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
};
