const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    role: {
      type: String,
      enum: [
        "Department User", // Can submit proposals
        "Technical Approver", // Can approve/reject technical
        "Administrative Approver", // Can approve/reject administrative
        "Tender Manager", // Can manage tenders
        "Work Order Manager", // Can create work orders
        "Progress Monitor", // Can update work progress
        "Super Admin", // Can do everything
        "Engineer",
      ],
      required: [true, "User role is required"],
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit contact number"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Virtual for user display name
userSchema.virtual("displayName").get(function () {
  return `${this.fullName} (${this.designation})`;
});

// Indexes (email and username already have unique indexes from schema definition)
userSchema.index({ role: 1, department: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model("User", userSchema);
