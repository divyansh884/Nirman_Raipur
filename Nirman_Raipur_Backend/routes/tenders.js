const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { auth } = require("../middleware/auth");
const { uploadFields, s3UploadDoc } = require("../middleware/upload");
const {
  startTenderProcess,
  updateTenderStatus,
  awardTender,
  getAllTenders,
} = require("../controllers/tenderController");

// Validation middleware
const startTenderValidation = [
  body("tenderTitle").notEmpty().withMessage("Tender title is required"),
  body("tenderID").notEmpty().withMessage("Tender ID is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("issuedDates").isISO8601().withMessage("Valid issued date is required"),
];

const updateTenderStatusValidation = [
  body("tenderStatus")
    .isIn([
      "Notice Published",
      "Bid Submission",
      "Under Evaluation",
      "Awarded",
      "Cancelled",
    ])
    .withMessage("Invalid tender status"),
];

const awardTenderValidation = [
  body("contractorName").notEmpty().withMessage("Contractor name is required"),
  body("awardedAmount")
    .isNumeric()
    .withMessage("Awarded amount must be a number"),
];

// @route   POST /api/work-proposals/:id/tender/start
// @desc    Start tender process
// @access  Private (Tender Manager)
router.post(
  "/:id/tender/start",
  auth,
  uploadFields,
  s3UploadDoc,
  startTenderValidation,
  startTenderProcess,
);

// @route   PUT /api/work-proposals/:id/tender/status
// @desc    Update tender status
// @access  Private (Tender Manager)
router.put(
  "/:id/tender/status",
  auth,
  updateTenderStatusValidation,
  updateTenderStatus,
);

// @route   POST /api/work-proposals/:id/tender/award
// @desc    Award tender to contractor
// @access  Private (Tender Manager)
router.post("/:id/tender/award", auth, awardTenderValidation, awardTender);

// @route   GET /api/tenders
// @desc    Get all tenders with filtering
// @access  Private (Tender Manager, Admin)
router.get("/", auth, getAllTenders);

module.exports = router;

