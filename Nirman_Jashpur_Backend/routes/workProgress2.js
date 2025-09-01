const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth.js");
const WorkProposal = require("../models/WorkProposal.js");
const {
  s3UploadDoc,
  s3UploadImages,
  uploadFields,
} = require("../middleware/upload.js");
const router = express.Router();

// ✅ NEW: Middleware to parse installments JSON string from form-data
const parseInstallments = (req, res, next) => {
  try {
    console.log("🔍 Raw installments received:", req.body.installments);
    
    if (!req.body.installments || req.body.installments === "") {
      req.body.installments = [];
      console.log("✅ Set empty installments array");
    } else if (typeof req.body.installments === 'string') {
      try {
        const parsed = JSON.parse(req.body.installments);
        
        // Convert dates to proper ISO format if needed
        if (Array.isArray(parsed)) {
          parsed.forEach(installment => {
            if (installment.date && typeof installment.date === 'string') {
              // Ensure date is in ISO format
              try {
                const date = new Date(installment.date);
                if (!isNaN(date.getTime())) {
                  installment.date = date.toISOString();
                }
              } catch (dateError) {
                console.warn("⚠️ Invalid date format:", installment.date);
              }
            }
          });
        }
        
        req.body.installments = parsed;
        console.log("✅ Parsed installments:", req.body.installments);
      } catch (parseError) {
        console.error("❌ Error parsing installments JSON:", parseError);
        req.body.installments = [];
      }
    }
    // If it's already an array, leave it as is
    
    next();
  } catch (error) {
    console.error("❌ Error in parseInstallments middleware:", error);
    req.body.installments = [];
    next();
  }
};

// ✅ Add Progress
router.post(
  "/:id/progress",
  auth,
  uploadFields,
  s3UploadDoc,
  s3UploadImages,
  parseInstallments, // ✅ CRITICAL: Parse installments before validation
  [
    param("id").isMongoId().withMessage("Invalid Work Proposal ID"),
    body("desc").optional().isString().withMessage("Description must be text"),
    body("sanctionedAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Sanctioned amount must be positive"),
    body("totalAmountReleasedSoFar")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Total amount released must be positive"),
    body("remainingBalance")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Remaining balance must be positive"),
    // ✅ UNCOMMENTED: Now installments validation works
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
    body("mbStageMeasurementBookStag")
      .optional()
      .isString()
      .withMessage("MB Stage must be text"),
    body("expenditureAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Expenditure amount must be positive"),
  ],
  async (req, res) => {
    try {
      // ✅ Check validation errors first
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: errors.array() 
        });
      }

      const { id } = req.params;
      
      // ✅ Find work proposal first
      const workProposal = await WorkProposal.findById(id);
      if (!workProposal) {
        return res.status(404).json({
          success: false,
          message: "Work Proposal not found",
        });
      }

      // ✅ Check authorization - Allow appointed engineer, admin, and superadmin
      const isAppointedEngineer = workProposal.appointedEngineer && 
                                 req.user.id === workProposal.appointedEngineer.id.toString();
      const isAdmin = req.user.role === 'admin';
      const isSuperAdmin = req.user.role === 'Super Admin' || req.user.role === 'superadmin';

      if (!isAppointedEngineer && !isAdmin && !isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: "Progress can only be updated by the appointed engineer, admin, or superadmin",
        });
      }

      // ✅ Extract data from request body
      const {
        desc,
        sanctionedAmount,
        totalAmountReleasedSoFar,
        remainingBalance,
        installments,
        mbStageMeasurementBookStag,
        expenditureAmount,
      } = req.body;

      // ✅ Get uploaded files
      const doc = req.s3Uploads?.document || null;
      const images = req.s3Uploads?.images || [];

      // ✅ Debug logs
      console.log("📋 Processing data:");
      console.log("- Description:", desc);
      console.log("- Sanctioned Amount:", sanctionedAmount);
      console.log("- Total Released:", totalAmountReleasedSoFar);
      console.log("- Remaining Balance:", remainingBalance);
      console.log("- Installments:", installments);
      console.log("- MB Stage:", mbStageMeasurementBookStag);
      console.log("- Expenditure Amount:", expenditureAmount);
      console.log("- Document:", doc);
      console.log("- Images count:", images.length);

      // ✅ Create new progress object
      const newProgress = {
        desc: desc || "",
        sanctionedAmount: sanctionedAmount ? parseFloat(sanctionedAmount) : null,
        totalAmountReleasedSoFar: totalAmountReleasedSoFar ? parseFloat(totalAmountReleasedSoFar) : null,
        remainingBalance: remainingBalance ? parseFloat(remainingBalance) : null,
        installments: installments || [], // ✅ Now properly parsed
        mbStageMeasurementBookStag: mbStageMeasurementBookStag || "",
        expenditureAmount: expenditureAmount ? parseFloat(expenditureAmount) : null,
        progressDocuments: doc,
        progressImages: {images}, // ✅ Fixed: Direct assignment, not nested
        lastUpdatedBy: req.user.id,
        createdAt: new Date(),
      };

      // ✅ Add progress to work proposal
      workProposal.workProgress = workProposal.workProgress || [];
      workProposal.workProgress.push(newProgress);
      
      await workProposal.save();

      console.log("✅ Progress added successfully:", newProgress);

      res.json({
        success: true,
        message: "Progress added successfully",
        data: workProposal.workProgress,
      });

    } catch (err) {
      console.error("❌ Error adding progress:", err);
      console.error("Error stack:", err.stack);
      res.status(500).json({
        success: false,
        message: "Server error: " + err.message,
      });
    }
  },
);

// ✅ Delete Progress
router.delete("/:id/progress/:progressId", auth, async (req, res) => {
  try {
    const { id, progressId } = req.params;
    
    const workProposal = await WorkProposal.findById(id);
    if (!workProposal) {
      return res.status(404).json({ 
        success: false, 
        message: "Work Proposal not found" 
      });
    }

    // ✅ Check authorization - Allow appointed engineer, admin, and superadmin
    const isAppointedEngineer = workProposal.appointedEngineer && 
                               req.user.id === workProposal.appointedEngineer.id.toString();
    const isAdmin = req.user.role === 'admin';
    const isSuperAdmin = req.user.role === 'Super Admin' || req.user.role === 'superadmin';

    if (!isAppointedEngineer && !isAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Progress can only be deleted by the appointed engineer, admin, or superadmin",
      });
    }

    // Remove the progress entry
    workProposal.workProgress = workProposal.workProgress.filter(
      (p) => p._id.toString() !== progressId,
    );
    
    await workProposal.save();
    
    res.json({ 
      success: true, 
      message: "Progress deleted successfully" 
    });
  } catch (err) {
    console.error("❌ Error deleting progress:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + err.message 
    });
  }
});

// ✅ Get Progress
router.get("/:id/progress", auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const workProposal = await WorkProposal.findById(id)
      .select("workProgress appointedEngineer")
      .populate("appointedEngineer.id", "name email");
      
    if (!workProposal) {
      return res.status(404).json({ 
        success: false, 
        message: "Work Proposal not found" 
      });
    }

    res.json({ 
      success: true, 
      data: workProposal.workProgress || [] 
    });
  } catch (err) {
    console.error("❌ Error getting progress:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + err.message 
    });
  }
});

module.exports = router;
