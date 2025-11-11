const express = require("express");
const router = express.Router();

const { uploadImageMiddleware, uploadImage } = require("../controllers/uploadController");
const { uploadDocMiddleware, uploadDocument } = require("../controllers/uploadDocuments");

// Image upload route (up to 3 images)
router.post("/images", uploadImageMiddleware, uploadImage);

// Document upload route (1 doc only)
router.post("/document", uploadDocMiddleware, uploadDocument);

module.exports = router;
