const Quote = require("../models/Quote");
const asyncHandler = require("../middleware/asyncHandler");

const createQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.create(req.body);

  res.status(201).json({
    success: true,
    message: "Quote request submitted successfully",
    data: {
      id: quote._id,
    },
  });
});

module.exports = {
  createQuote,
};