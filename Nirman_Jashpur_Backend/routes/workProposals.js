const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { auth } = require("../middleware/auth");
const {
  createWorkProposal,
  getWorkProposals,
  getWorkProposal,
  updateWorkProposal,
  deleteWorkProposal,
  technicalApproval,
  administrativeApproval,
} = require("../controllers/workProposalController");

// Validation middleware
const workProposalValidation = [
  // change this
  body("typeOfWork").trim().isMongoId().withMessage("Invalid Type of work id"),
  body("nameOfWork").trim().notEmpty().withMessage("Name of work is required"),
  // change this
  body("workAgency").trim().isMongoId().withMessage("Invalid Work agency id"),
  // change this
  body("scheme").trim().isMongoId().withMessage("Invalid Scheme id"),
  body("workDescription").trim()
    .notEmpty()
    .withMessage("Work description is required"),
  body("financialYear").trim().notEmpty().withMessage("Financial year is required"),
  // change this
  body("workDepartment").trim().isMongoId().withMessage("Invalid Work department id"),
  // change this
  body("approvingDepartment").trim().isMongoId()
    .withMessage("Invalid Approving department id"),
  body("sanctionAmount").trim()
    .isNumeric()
    .withMessage("Sanction amount must be a number"),
  body("estimatedCompletionDateOfWork").trim()
    .isISO8601()
    .withMessage("Valid completion date is required"),
  body("city").trim().isMongoId().withMessage("Invalid city id"),
  body("typeOfLocation").trim().isMongoId()
    .withMessage("Invalid typeOfLocation id"),
  body("ward").trim().isMongoId()
    .withMessage("Invalid ward id"),
  body("appointedSDO").trim().isMongoId()
    .withMessage("Invalid sdo id"),
  body("appointedEngineer").trim().isMongoId()
    .withMessage("Invalid appointed Engineer id"),
];

const technicalApprovalValidation = [
  body("action")
    .isIn(["approve", "reject"])
    .withMessage("Action must be approve or reject"),
  body("approvalNumber")
    .if(body("action").equals("approve"))
    .notEmpty()
    .withMessage("Approval number is required for approval"),
  body("rejectionReason")
    .if(body("action").equals("reject"))
    .notEmpty()
    .withMessage("Rejection reason is required for rejection"),
];

const administrativeApprovalValidation = [
  body("action")
    .isIn(["approve", "reject"])
    .withMessage("Action must be approve or reject"),
  body("approvalNumber")
    .if(body("action").equals("approve"))
    .notEmpty()
    .withMessage("Approval number is required for approval"),
  body("approvedAmount")
    .if(body("action").equals("approve"))
    .isNumeric()
    .withMessage("Approved amount is required for approval"),
  body("rejectionReason")
    .if(body("action").equals("reject"))
    .notEmpty()
    .withMessage("Rejection reason is required for rejection"),
];

// @route   POST /api/work-proposals
// @desc    Create new work proposal
// @access  Private (Department User)
router.post("/", auth, workProposalValidation, createWorkProposal);

// @route   GET /api/work-proposals
// @desc    Get all work proposals with filtering and pagination
// @access  Private
router.get("/", auth, getWorkProposals);

// @route   GET /api/work-proposals/:id
// @desc    Get single work proposal by ID
// @access  Private
router.get("/:id", auth, getWorkProposal);

// @route   PUT /api/work-proposals/:id
// @desc    Update work proposal (basic info only, before technical approval)
// @access  Private (Only submitter)
router.put("/:id", auth, updateWorkProposal);

// @route   DELETE /api/work-proposals/:id
// @desc    Delete work proposal (before technical approval)
// @access  Private (Only submitter or Super Admin)
router.delete("/:id", auth, deleteWorkProposal);

// @route   POST /api/work-proposals/:id/technical-approval
// @desc    Technical approval/rejection
// @access  Private (Technical Approver)
router.post(
  "/:id/technical-approval",
  auth,
  technicalApprovalValidation,
  technicalApproval,
);

// @route   POST /api/work-proposals/:id/administrative-approval
// @desc    Administrative approval/rejection
// @access  Private (Administrative Approver)
router.post(
  "/:id/administrative-approval",
  auth,
  administrativeApprovalValidation,
  administrativeApproval,
);

module.exports = router;
