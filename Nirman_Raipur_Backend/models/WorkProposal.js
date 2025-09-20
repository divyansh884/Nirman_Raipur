const mongoose = require("mongoose");
const { documentSchema } = require("./Document");
const { imageSchema } = require("./Image");

// Technical Approval Schema
const technicalApprovalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvalNumber: {
      type: String,
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    amountOfTechnicalSanction: {
      type: Number,
      min: 0,
      default: null,
    },
    forwardingDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: null,
    },
    attachedFile: documentSchema,
    attachedImages: imageSchema,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Administrative Approval Schema
const administrativeApprovalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    byGovtDistrictAS: {
      type: String,
      default: null,
    },
    approvalNumber: {
      type: String,
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    approvedAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    remarks: {
      type: String,
      default: null,
    },
    attachedFile: documentSchema,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Tender Process Schema
const tenderProcessSchema = new mongoose.Schema(
  {
    tenderTitle: {
      type: String,
      default: null,
    },
    tenderID: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    attachedFile: documentSchema,
    issuedDates: {
      type: Date,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },
    tenderStatus: {
      type: String,
      enum: [
        "Not Started",
        "Notice Published",
        "Bid Submission",
        "Under Evaluation",
        "Awarded",
        "Cancelled",
      ],
      default: "Not Started",
    },
    selectedContractor: {
      name: String,
      contactInfo: String,
      awardedAmount: Number,
    },
  },
  { timestamps: true },
);

// Work Order Schema
const workOrderSchema = new mongoose.Schema(
  {
    workOrderNumber: {
      type: String,
      default: null,
    },
    dateOfWorkOrder: {
      type: Date,
      default: null,
    },

    contractorOrGramPanchayat: {
      type: String,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },
    attachedFile: documentSchema,
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// Work Progress Schema
const workProgressSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
      default: null,
    },
    sanctionedAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    totalAmountReleasedSoFar: {
      type: Number,
      min: 0,
      default: null,
    },
    remainingBalance: {
      type: Number,
      default: null,
    },
    installments: [
      {
        installmentNo: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          min: 0,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
      },
    ],
    mbStageMeasurementBookStag: {
      type: String,
      default: null,
    },
    expenditureAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    progressDocuments: documentSchema,
    progressImages: imageSchema,
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// Main Work Proposal Schema
const workProposalSchema = new mongoose.Schema(
  {
    // Serial Number (Auto-generated)
    serialNumber: {
      type: String,
      unique: true,
      required: false,
    },

    // Image/Photo of work location
    workLocationImage: imageSchema,

    // Type of work
    typeOfWork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypeOfWork",
      required: true,
    },

    // Name of work
    nameOfWork: {
      type: String,
      required: [true, "Name of work is required"],
      trim: true,
      maxlength: [500, "Work name cannot exceed 500 characters"],
    },

    // Work Agency
    workAgency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkAgency",
      required: true,
    },

    // Scheme
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },

    // Name of JP/DBT
    nameOfJPDBT: {
      type: String,
      trim: true,
      default: null,
    },

    // Name of GP/Ward
    nameOfGPWard: {
      type: String,
      trim: true,
      default: null,
    },

    // Work Description
    workDescription: {
      type: String,
      required: [true, "Work description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Work Progress Stage
    workProgressStage: {
      type: String,
      enum: [
        "Pending Technical Approval",
        "Rejected Technical Approval",
        "Pending Administrative Approval",
        "Rejected Administrative Approval",
        "Pending Tender",
        "Tender In Progress",
        "Pending Work Order",
        "Work Order Created",
        "Work In Progress",
        "Work Completed",
        "Work Cancelled",
      ],
      default: "Pending Technical Approval",
    },

    // Last Revision
    lastRevision: {
      type: Date,
      default: Date.now,
    },

    // Additional fields from the input diagram
    financialYear: {
      type: String,
      required: [true, "Financial year is required"],
    },

    workDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    approvingDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    sanctionAmount: {
      type: Number,
      required: [true, "Sanction amount is required"],
      min: [0, "Sanction amount cannot be negative"],
    },

    plan: {
      type: String,
      trim: true,
      default: null,
    },

    assembly: {
      type: String,
      trim: true,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    latitude: {
      type: Number,
      default: null,
    },

    typeOfLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypeOfLocation",
      required: true,
    },

    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
    },

    workOrderAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    //Karya Shreni
    map: {
      type: String,
      trim: true,
      default: null,
    },

    landmarkNumber: {
      type: String,
      trim: true,
      default: null,
    },

    promise: {
      type: String,
      trim: true,
      default: null,
    },

    workName: {
      type: String,
      trim: true,
      default: null,
    },

    //Important
    appointedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    appointedSDO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SDO",
      required: true,
    },

    estimatedCompletionDateOfWork: {
      type: Date,
      required: [true, "Estimated completion date is required"],
    },

    isDPROrNot: {
      type: Boolean,
      default: false,
    },

    isTenderOrNot: {
      type: Boolean,
      default: false,
    },

    // Submission Details
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    submissionDate: {
      type: Date,
      default: Date.now,
    },

    // Initial documents uploaded during proposal creation
    initialDocuments: documentSchema,

    // All approval stages
    technicalApproval: technicalApprovalSchema,
    administrativeApproval: administrativeApprovalSchema,
    tenderProcess: tenderProcessSchema,
    workOrder: workOrderSchema,
    workProgress: [workProgressSchema],

    // Completion Details
    completionDate: {
      type: Date,
      default: null,
    },

    completionDocuments: documentSchema,

    finalCost: {
      type: Number,
      default: null,
    },

    // Current Status (computed field)
    currentStatus: {
      type: String,
      enum: [
        "Pending Technical Approval",
        "Rejected Technical Approval",
        "Pending Administrative Approval",
        "Rejected Administrative Approval",
        "Pending Tender",
        "Tender In Progress",
        "Pending Work Order",
        "Work Order Created",
        "Work In Progress",
        "Work Completed",
        "Work Cancelled",
        "Work Stopped",
        "Work Not Started",
      ],
      default: "Pending Technical Approval",
    },

    // Timestamps
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Pre-save middleware to generate serial number
workProposalSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.serialNumber = `WP${year}${String(count + 1).padStart(6, "0")}`;
  }

  if (
    this.isModified("currentStatus") ||
    this.isModified("workProgressStage")
  ) {
    this.lastStatusUpdate = new Date();
    this.lastRevision = new Date();
  }

  // Auto-calculate remaining balance
  if (
    this.workProgress &&
    this.workProgress.sanctionedAmount &&
    this.workProgress.totalAmountReleasedSoFar
  ) {
    this.workProgress.remainingBalance =
      this.workProgress.sanctionedAmount -
      this.workProgress.totalAmountReleasedSoFar;
  }

  next();
});

// Virtual for calculating work duration
workProposalSchema.virtual("workDuration").get(function () {
  if (this.workOrder && this.workOrder.dateOfWorkOrder && this.completionDate) {
    const diffTime = Math.abs(
      this.completionDate - this.workOrder.dateOfWorkOrder,
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Virtual for overall progress percentage
workProposalSchema.virtual("overallProgress").get(function () {
  if (this.currentStatus === "Work Completed") return 100;
  if (this.workProgress && this.workProgress.progressPercentage) {
    return this.workProgress.progressPercentage;
  }
  return 0;
});

// Indexes for better performance (serialNumber already has unique index from schema definition)
workProposalSchema.index({ currentStatus: 1, workProgressStage: 1 });
workProposalSchema.index({ workDepartment: 1, approvingDepartment: 1 });
workProposalSchema.index({ submittedBy: 1 });
workProposalSchema.index({ submissionDate: -1 });
workProposalSchema.index({ lastStatusUpdate: -1 });
workProposalSchema.index({ financialYear: 1 });
workProposalSchema.index({ city: 1, ward: 1 });

// Text search index
workProposalSchema.index({
  nameOfWork: "text",
  workDescription: "text",
  workAgency: "text",
  scheme: "text",
  workDepartment: "text",
});

module.exports = mongoose.model("WorkProposal", workProposalSchema);
