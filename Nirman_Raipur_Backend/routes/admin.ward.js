const express = require("express");
const Ward = require("../models/subSchema/ward");
const WorkProposal = require('../models/WorkProposal'); 
const mongoose = require('mongoose');
const router = express.Router();
const { auth, authorizeRole } = require("../middleware/auth");

// Create
router.post("/", auth, authorizeRole("Super Admin"), async (req, res) => {
  try {
    const doc = new Ward(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  const docs = await Ward.find();
  res.json(docs);
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const doc = await Ward.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update
router.put("/:id", auth, authorizeRole("Super Admin"), async (req, res) => {
  try {
    const doc = await Ward.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
router.delete(
  "/:id", 
  auth, 
  authorizeRole("Super Admin"), 
  async (req, res) => {
    try {
      const wardId = req.params.id;
      
      // First, check if the Ward exists
      const ward = await Ward.findById(wardId);
      if (!ward) {
        return res
          .status(404)
          .json({ success: false, message: 'Ward not found' });
      }

      console.log(`🔍 Checking references for Ward: ${ward.name} (ID: ${wardId})`);

      // ✅ COMPREHENSIVE CHECK: Get ALL work proposals and check manually
      const allWorkProposals = await WorkProposal.find({}, 
        'ward nameOfWork serialNumber currentStatus'
      );
      
      // Filter work proposals that use this ward
      const workProposalsWithWard = allWorkProposals.filter(wp => {
        if (wp.ward && wp.ward._id) {
          const workProposalWardId = wp.ward._id.toString();
          return workProposalWardId === wardId;
        }
        return false;
      });

      console.log(`🔍 Checked ${allWorkProposals.length} total work proposals`);
      console.log(`📊 Found ${workProposalsWithWard.length} work proposals using Ward "${ward.name}" (ID: ${wardId})`);

      // Log the matching work proposals for debugging
      if (workProposalsWithWard.length > 0) {
        console.log(`🚫 Work proposals using this Ward:`);
        workProposalsWithWard.forEach(wp => {
          console.log(`   - ${wp.serialNumber}: ${wp.nameOfWork} (Ward: ${wp.ward.name})`);
        });
      }

      // ✅ PREVENT DELETION if Ward is being used
      if (workProposalsWithWard.length > 0) {
        const workProposalDetails = workProposalsWithWard.map(wp => ({
          id: wp._id,
          serialNumber: wp.serialNumber,
          nameOfWork: wp.nameOfWork,
          currentStatus: wp.currentStatus,
          wardName: wp.ward?.name
        }));

        return res.status(400).json({
          success: false,
          message: `Cannot delete Ward "${ward.name}": It is being used by ${workProposalsWithWard.length} work proposal(s)`,
          details: {
            wardId: wardId,
            wardName: ward.name,
            totalReferences: workProposalsWithWard.length,
            referencedBy: {
              collection: "Work Proposals",
              count: workProposalsWithWard.length,
              workProposals: workProposalDetails
            },
            suggestions: [
              "Update the ward field in all referenced work proposals before deleting this ward",
              "Consider reassigning work proposals to a different ward",
              "Contact the system administrator if this ward needs to be merged with another ward"
            ]
          }
        });
      }

      // ✅ NO REFERENCES FOUND - Safe to delete
      console.log(`✅ No references found for Ward "${ward.name}". Safe to delete.`);
      
      await Ward.findByIdAndDelete(wardId);
      
      console.log(`🗑️ Successfully deleted Ward: ${ward.name} (ID: ${wardId})`);
      
      res.json({ 
        success: true, 
        message: `Ward "${ward.name}" deleted successfully`,
        data: {
          deletedWard: {
            id: ward._id,
            name: ward.name,
            deletedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error("❌ Error deleting Ward:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);


module.exports = router;
