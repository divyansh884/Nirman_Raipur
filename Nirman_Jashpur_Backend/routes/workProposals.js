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
  body("typeOfWork").notEmpty().withMessage("Type of work is required"),
  body("nameOfWork").notEmpty().withMessage("Name of work is required"),
  // change this
  body("workAgency").notEmpty().withMessage("Work agency is required"),
  // change this
  body("scheme").notEmpty().withMessage("Scheme is required"),
  body("workDescription")
    .notEmpty()
    .withMessage("Work description is required"),
  body("financialYear").notEmpty().withMessage("Financial year is required"),
  // change this
  body("workDepartment").notEmpty().withMessage("Work department is required"),
  // change this
  body("approvingDepartment")
    .notEmpty()
    .withMessage("Approving department is required"),
  body("sanctionAmount")
    .isNumeric()
    .withMessage("Sanction amount must be a number"),
  body("estimatedCompletionDateOfWork")
    .isISO8601()
    .withMessage("Valid completion date is required"),
  body("city")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Invalid city id"),
  body("typeOfLocation")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Invalid typeOfLocation id"),
  body("ward")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Invalid ward id"),
  body("sdo")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Invalid sdo id"),
  body("appointedEngineer")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Invalid appointedEngineer id"),
];

const technicalApprovalValidation = [
  body("action")
    .isIn(["approve", "reject"])
    .withMessage("Action must be approve or reject"),
  body("approvalNumber")
    .if(body("action").equals("approve"))
    .notEmpty()
    .withMessage("Approval number is required for approval"),
  body("amountOfTechnicalSanction")
    .if(body("action").equals("approve"))
    .isNumeric()
    .withMessage("Technical sanction amount is required for approval"),
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

