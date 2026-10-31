
import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return this.discountType !== "percentage" || value <= 100;
        },
        message: "Percentage discount cannot exceed 100%.",
      },
    },

    // Discount conditions
    minimumPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Discount applicability
    appliesTo: {
      type: String,
      enum: ["product", "subscription"],
      required: true,
    },

    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Validity
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value > this.startDate;
        },
        message: "End date must be after the start date.",
      },
    },

    // Usage limit
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          return this.usageLimit === null ||
            this.usageLimit === undefined ||
            value <= this.usageLimit;
        },
        message: "Used count cannot exceed the usage limit.",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Improve discount filtering
discountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
discountSchema.index({ appliesTo: 1, isActive: 1 });
discountSchema.index({ applicableProducts: 1 });
discountSchema.index({ createdBy: 1 });

const discountModel = mongoose.model("Discount", discountSchema);

export default discountModel;
