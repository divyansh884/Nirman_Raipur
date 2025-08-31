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
          ACL: "public-read",
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

module.exports = { uploadImageMiddleware, uploadImage };
