const multer = require("multer");
const s3 = require("../utils/s3");

const ImageGroup = require("../models/Image").imageModel;

// store files in memory before uploading to S3
const upload = multer({ storage: multer.memoryStorage() });

// allow up to 3 images
const uploadImageMiddleware = upload.array("images", 3);

const uploadImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    // Upload each file to S3 and prepare metadata
    const uploadedImages = await Promise.all(
      req.files.map(async (file) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const data = await s3.upload(params).promise();

        return {
          url: data.Location,
          key: data.Key,
          bucket: params.Bucket,
          contentType: file.mimetype,
          size: file.size,
        };
      })
    );

    // Save the images in MongoDB
    const imageGroup = await ImageGroup.create({ images: uploadedImages });

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images: imageGroup,
    });
  } catch (err) {
    console.error("S3 Image Upload Error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading images",
      error: err.message,
    });
    next(err);
  }
};

const getFileView = async (req, res) => {
  try {
    let { key, url } = req.query;

    if (!key && url) {
      try {
        const parsed = new URL(url);
        key = decodeURIComponent(parsed.pathname.substring(1));
      } catch (e) {
        key = url;
      }
    }

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "File key or URL is required",
      });
    }

    const bucket = process.env.AWS_S3_BUCKET;

    // Generate AWS S3 Presigned URL (valid for 1 hour)
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 3600,
    };

    s3.getSignedUrl("getObject", params, (err, signedUrl) => {
      if (err || !signedUrl) {
        console.error("S3 getSignedUrl Error, falling back to stream:", err);
        // Fallback: stream file directly from S3
        s3.getObject({ Bucket: bucket, Key: key })
          .createReadStream()
          .on("error", (streamErr) => {
            console.error("S3 Stream Error:", streamErr);
            if (!res.headersSent) {
              return res.status(404).json({
                success: false,
                message: "File not found or access denied in storage",
              });
            }
          })
          .pipe(res);
      } else {
        // Redirect browser to signed S3 URL
        res.redirect(signedUrl);
      }
    });
  } catch (error) {
    console.error("Get File View Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error retrieving file",
        error: error.message,
      });
    }
  }
};

module.exports = { uploadImageMiddleware, uploadImage, getFileView };
