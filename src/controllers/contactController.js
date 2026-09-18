const Contact = require("../models/Contact");
const asyncHandler = require("../middleware/asyncHandler");

const createContact = asyncHandler(async (req, res) => {
  const contact = await Contact.create(req.body);

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: {
      id: contact._id,
    },
  });
});

module.exports = {
  createContact,
};