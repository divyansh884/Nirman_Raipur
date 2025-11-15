const express = require("express");
const TypeOfLocation = require("../models/subSchema/typeOfLocation");
const WorkProposal = require('../models/WorkProposal'); 
const mongoose = require('mongoose');
const router = express.Router();
const { auth, authorizeRole } = require("../middleware/auth");

// Create
router.post("/", auth, authorizeRole("Super Admin"), async (req, res) => {
  try {
    const doc = new TypeOfLocation(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  const docs = await TypeOfLocation.find();
  res.json(docs);
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const doc = await TypeOfLocation.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update
router.patch("/:id", auth, authorizeRole("Super Admin"), async (req, res) => {
  try {
    const doc = await TypeOfLocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
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
      const typeOfLocationId = req.params.id;
      
      // First, check if the TypeOfLocation exists
      const typeOfLocation = await TypeOfLocation.findById(typeOfLocationId);
      if (!typeOfLocation) {
        return res
          .status(404)
          .json({ success: false, message: 'Type of Location not found' });
      }

      console.log(`🔍 Checking references for Type of Location: ${typeOfLocation.name} (ID: ${typeOfLocationId})`);

      // ✅ COMPREHENSIVE CHECK: Get ALL work proposals and check manually
      const allWorkProposals = await WorkProposal.find({}, 
        'typeOfLocation nameOfWork serialNumber currentStatus'
      );
      
      // Filter work proposals that use this type of location
      const workProposalsWithTypeOfLocation = allWorkProposals.filter(wp => {
        if (wp.typeOfLocation && wp.typeOfLocation._id) {
          const workProposalTypeOfLocationId = wp.typeOfLocation._id.toString();
          return workProposalTypeOfLocationId === typeOfLocationId;
        }
        return false;
      });

      console.log(`🔍 Checked ${allWorkProposals.length} total work proposals`);
      console.log(`📊 Found ${workProposalsWithTypeOfLocation.length} work proposals using Type of Location "${typeOfLocation.name}" (ID: ${typeOfLocationId})`);

      // Log the matching work proposals for debugging
      if (workProposalsWithTypeOfLocation.length > 0) {
        console.log(`🚫 Work proposals using this Type of Location:`);
        workProposalsWithTypeOfLocation.forEach(wp => {
          console.log(`   - ${wp.serialNumber}: ${wp.nameOfWork} (Type: ${wp.typeOfLocation.name})`);
        });
      }

      // ✅ PREVENT DELETION if Type of Location is being used
      if (workProposalsWithTypeOfLocation.length > 0) {
        const workProposalDetails = workProposalsWithTypeOfLocation.map(wp => ({
          id: wp._id,
          serialNumber: wp.serialNumber,
          nameOfWork: wp.nameOfWork,
          currentStatus: wp.currentStatus,
          typeOfLocationName: wp.typeOfLocation?.name
        }));

        return res.status(400).json({
          success: false,
          message: `Cannot delete Type of Location "${typeOfLocation.name}": It is being used by ${workProposalsWithTypeOfLocation.length} work proposal(s)`,
          details: {
            typeOfLocationId: typeOfLocationId,
            typeOfLocationName: typeOfLocation.name,
            totalReferences: workProposalsWithTypeOfLocation.length,
            referencedBy: {
              collection: "Work Proposals",
              count: workProposalsWithTypeOfLocation.length,
              workProposals: workProposalDetails
            },
            suggestions: [
              "Update the type of location field in all referenced work proposals before deleting this type of location",
              "Consider reassigning work proposals to a different type of location",
              "Contact the system administrator if this type of location needs to be merged with another type"
            ]
          }
        });
      }

      // ✅ NO REFERENCES FOUND - Safe to delete
      console.log(`✅ No references found for Type of Location "${typeOfLocation.name}". Safe to delete.`);
      
      await TypeOfLocation.findByIdAndDelete(typeOfLocationId);
      
      console.log(`🗑️ Successfully deleted Type of Location: ${typeOfLocation.name} (ID: ${typeOfLocationId})`);
      
      res.json({ 
        success: true, 
        message: `Type of Location "${typeOfLocation.name}" deleted successfully`,
        data: {
          deletedTypeOfLocation: {
            id: typeOfLocation._id,
            name: typeOfLocation.name,
            deletedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error("❌ Error deleting Type of Location:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);


module.exports = router;
