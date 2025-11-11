const multer = require("multer");
const s3 = require("../utils/s3");
const {documentModel : S3File} = require("../models/Document");

// store files in memory before uploading
const upload = multer({ storage: multer.memoryStorage() });

// allow only 1 document
const uploadDocMiddleware = upload.single("document");

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document uploaded",
      });
    }

    // Upload to S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `documents/${Date.now()}_${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: "public-read", // makes file permanently public
    };

    const data = await s3.upload(params).promise();

    // ✅ Save metadata in MongoDB immediately
    const savedDoc = await S3File.create({
      key: data.Key,
      size: req.file.size,
      lastModified: new Date(),
      storageClass: "STANDARD",
      eTag: data.ETag,
      url: data.Location,
    });

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: savedDoc._id,   // MongoDB id
        url: savedDoc.url,  // permanent public URL
        key: savedDoc.key,  // useful for deletion
      },
    });
  } catch (err) {
    console.error("S3 Document Upload Error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading document",
      error: err.message,
    });
    next(err);
  }
};

module.exports = { uploadDocMiddleware, uploadDocument };
