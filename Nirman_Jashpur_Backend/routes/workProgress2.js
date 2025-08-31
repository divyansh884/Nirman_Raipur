const express = require("express");
const { body, param } = require("express-validator");
const {auth} = require("../middleware/auth.js");
const WorkProposal = require("../models/WorkProposal.js");
const {
  s3UploadDoc,
  s3UploadImages,
  uploadFields,
} = require("../middleware/upload.js");

const router = express.Router();

// ✅ Add Progress
router.post(
  "/:id/progress",
  auth,
  uploadFields,
  s3UploadDoc,
  s3UploadImages,
  [
    param("id").isMongoId().withMessage("Invalid Work Proposal ID"),

    body("desc").optional().isString().withMessage("Description must be text"),

    body("sanctionedAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Sanctioned amount must be positive"),

    body("installments")
      .optional()
      .isArray()
      .withMessage("Installments must be an array"),
    body("installments.*.installmentNo")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Installment number must be >= 1"),
    body("installments.*.amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Installment amount must be positive"),
    body("installments.*.date")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),

    body("expenditureAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Expenditure amount must be positive"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const {
        desc,
        sanctionedAmount,
        totalAmountReleasedSoFar,
        remainingBalance,
        installments,
        mbStageMeasurementBookStag,
        expenditureAmount,
      } = req.body;

      const workProposal = await WorkProposal.findById(id);
      if (req.user.id != workProposal.appointedEngineer.id) {
        return res.status(400).json({
          success: false,
          error: "progress must be updated by the appointed engineer only",
        });
      }

      if (!workProposal) {
        return res.status(404).json({
          success: false,
          message: "Work Proposal not found",
        });
      }

      const doc = req.s3Uploads?.document || null;
      const images = req.s3Uploads?.images || [];

      const newProgress = {
        desc,
        sanctionedAmount,
        totalAmountReleasedSoFar,
        remainingBalance,
        installments: installments || [],
        mbStageMeasurementBookStag,
        expenditureAmount,
        progressDocuments: doc,
        progressImages: { images },
        lastUpdatedBy: req.user.id,
      };

      workProposal.workProgress.push(newProgress);

      await workProposal.save();

      res.json({
        success: true,
        data: workProposal.workProgress,
      });
    } catch (err) {
      console.error("Error adding progress:", err);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// ✅ Delete Progress
router.delete("/:id/progress/:progressId", auth, async (req, res) => {
  try {
    const { id, progressId } = req.params;
    const workProposal = await WorkProposal.findById(id);
    if (!workProposal)
      return res.status(404).json({ success: false, message: "Not found" });

    workProposal.workProgress = workProposal.workProgress.filter(
      (p) => p._id.toString() !== progressId,
    );

    await workProposal.save();
    res.json({ success: true, message: "Progress deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get Progress
router.get("/:id/progress", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const workProposal = await WorkProposal.findById(id).select("workProgress");
    if (!workProposal)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: workProposal.workProgress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router
