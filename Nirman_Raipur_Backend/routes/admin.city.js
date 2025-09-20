const express = require("express");
const { body, param, validationResult } = require("express-validator");
const City = require("../models/subSchema/city");
const { auth, authorizeRole } = require("../middleware/auth");
const WorkProposal = require('../models/WorkProposal'); 
const mongoose = require('mongoose');
const router = express.Router();

// Helper for validation
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// --- CREATE ---
// POST /api/admin/city
router.post(
  "/",
  auth,
  authorizeRole("Super Admin"),
  validate([body("name").trim().notEmpty().isLength({ max: 200 })]), // ✅ Changed cityName to name
  async (req, res) => {
    try {
      const { name } = req.body; // ✅ Changed cityName to name

      const exists = await City.findOne({ name }); // ✅ Changed cityName to name
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: "City already exists" });
      }

      const city = await City.create({ name }); // ✅ Changed cityName to name
      res
        .status(201)
        .json({ success: true, message: "City created", data: city });
    } catch (error) {
      console.error("Error creating city:", error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "City already exists",
          error: "Duplicate city name"
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- READ ALL ---
// GET /api/admin/city
router.get(
  "/",
  // auth,
  // authorizeRole("Super Admin"),
  async (req, res) => {
    try {
      const cities = await City.find().sort({ createdAt: -1 });
      res.json({ success: true, data: cities });
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- READ ONE ---
// GET /api/admin/city/:id
router.get(
  "/:id",
  // auth,
  // authorizeRole("Super Admin"),
  validate([param("id").isMongoId()]),
  async (req, res) => {
    try {
      const city = await City.findById(req.params.id);
      if (!city) {
        return res
          .status(404)
          .json({ success: false, message: "City not found" });
      }
      res.json({ success: true, data: city });
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- UPDATE ---
// PATCH /api/admin/city/:id
router.patch(
  "/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([
    param("id").isMongoId(),
    body("name").optional().isLength({ max: 200 }), // ✅ Changed cityName to name
  ]),
  async (req, res) => {
    try {
      if (req.body.name) { // ✅ Changed cityName to name
        const exists = await City.findOne({
          name: req.body.name, // ✅ Changed cityName to name
          _id: { $ne: req.params.id },
        });
        if (exists) {
          return res
            .status(409)
            .json({ success: false, message: "City name already in use" });
        }
      }

      const city = await City.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      if (!city) {
        return res
          .status(404)
          .json({ success: false, message: "City not found" });
      }
      
      res.json({ success: true, message: "City updated", data: city });
    } catch (error) {
      console.error("Error updating city:", error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "City name already exists",
          error: "Duplicate city name"
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- DELETE ---
// DELETE /api/admin/city/:id

router.delete(
  "/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([param("id").isMongoId()]),
  async (req, res) => {
    try {
      const cityId = req.params.id;
      
      // First, check if the city exists
      const city = await City.findById(cityId);
      if (!city) {
        return res
          .status(404)
          .json({ success: false, message: "City not found" });
      }

      console.log(`🔍 Checking references for city: ${city.name} (ID: ${cityId})`);

      // ✅ CONVERT to ObjectId for proper comparison
      const cityObjectId = new mongoose.Types.ObjectId(cityId);

      // ✅ MULTIPLE QUERY APPROACHES - try different ways to find references
      const queries = [
        { "city._id": cityObjectId },         // ObjectId comparison
        { "city._id": cityId },               // String comparison  
        { "city": cityObjectId },             // Direct city reference
      ];

      let workProposalsWithCity = [];
      let queryUsed = '';

      // Try each query until we find results or exhaust all options
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        console.log(`🔍 Trying query ${i + 1}:`, JSON.stringify(query));
        
        const results = await WorkProposal.find(query)
          .select('_id nameOfWork serialNumber city currentStatus');
        
        if (results.length > 0) {
          workProposalsWithCity = results;
          queryUsed = JSON.stringify(query);
          console.log(`✅ Found ${results.length} work proposals using query: ${queryUsed}`);
          break;
        }
      }

      // ✅ ADDITIONAL DEBUG: Let's also check what cities actually exist in work proposals
      const allCities = await WorkProposal.distinct('city._id');
      console.log(`📊 All city IDs in work proposals:`, allCities);
      console.log(`🎯 Looking for city ID:`, cityId);
      console.log(`🎯 Looking for city ObjectId:`, cityObjectId);

      // Check if our city ID matches any of the existing city IDs
      const cityExists = allCities.some(existingCityId => 
        existingCityId.toString() === cityId || 
        existingCityId.equals && existingCityId.equals(cityObjectId)
      );

      console.log(`🔍 City exists in work proposals:`, cityExists);

      // If no results from queries but city exists in distinct check, try aggregation
      if (workProposalsWithCity.length === 0 && cityExists) {
        console.log(`🔄 Trying aggregation approach...`);
        
        workProposalsWithCity = await WorkProposal.aggregate([
          {
            $match: {
              $or: [
                { "city._id": cityObjectId },
                { "city._id": cityId }
              ]
            }
          },
          {
            $project: {
              _id: 1,
              nameOfWork: 1,
              serialNumber: 1,
              city: 1,
              currentStatus: 1
            }
          }
        ]);

        console.log(`📊 Aggregation found ${workProposalsWithCity.length} work proposals`);
      }

      // ✅ PREVENT DELETION if city is being used
      if (workProposalsWithCity.length > 0) {
        const workProposalDetails = workProposalsWithCity.map(wp => ({
          id: wp._id,
          serialNumber: wp.serialNumber,
          nameOfWork: wp.nameOfWork,
          currentStatus: wp.currentStatus,
          cityName: wp.city?.name
        }));

        console.log(`🚫 BLOCKING DELETION: Found ${workProposalsWithCity.length} work proposals using this city`);

        return res.status(400).json({
          success: false,
          message: `Cannot delete city "${city.name}": It is being used by ${workProposalsWithCity.length} work proposal(s)`,
          details: {
            cityId: cityId,
            cityName: city.name,
            totalReferences: workProposalsWithCity.length,
            queryUsed: queryUsed,
            referencedBy: {
              collection: "Work Proposals",
              count: workProposalsWithCity.length,
              workProposals: workProposalDetails
            },
            suggestions: [
              "Update the city field in all referenced work proposals before deleting this city",
              "Consider reassigning work proposals to a different city",
              "Contact the system administrator if this city needs to be merged with another city"
            ]
          }
        });
      }

      // ✅ NO REFERENCES FOUND - Safe to delete
      console.log(`✅ No references found for city "${city.name}". Safe to delete.`);
      
      await City.findByIdAndDelete(cityId);
      
      console.log(`🗑️ Successfully deleted city: ${city.name} (ID: ${cityId})`);
      
      res.json({ 
        success: true, 
        message: `City "${city.name}" deleted successfully`,
        data: {
          deletedCity: {
            id: city._id,
            name: city.name,
            deletedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error("❌ Error deleting city:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);


module.exports = router;
