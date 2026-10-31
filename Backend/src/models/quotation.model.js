
import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    templateName: {
      type: String,
      default: null,
      trim: true,
    },

    validDays: {
      type: Number,
      default: 15,
      min: 1,
    },

    quotationDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.quotationDate || value > this.quotationDate;
        },
        message: "Expiry date must be after quotation date.",
      },
    },

    paymentTerms: {
      type: String,
      default: "Due on receipt",
      trim: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },

        tax: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tax",
          default: null,
        },

        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "quotation",
        "confirmed",
        "rejected",
        "expired",
        "converted",
      ],
      default: "draft",
      index: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Improve quotation filtering and sorting
quotationSchema.index({ customer: 1, status: 1 });
quotationSchema.index({ expiryDate: 1, status: 1 });
quotationSchema.index({ createdBy: 1, createdAt: -1 });

const quotationModel = mongoose.model("Quotation", quotationSchema);

export default quotationModel;
