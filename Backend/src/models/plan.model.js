
import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    billingCycle: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },

    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          return !value || !this.startDate || value > this.startDate;
        },
        message: "End date must be after the start date.",
      },
    },

    allowEarlyClosure: {
      type: Boolean,
      default: false,
    },

    allowPause: {
      type: Boolean,
      default: false,
    },

    allowRenewal: {
      type: Boolean,
      default: true,
    },

    autoClose: {
      type: Boolean,
      default: false,
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

// Improve plan filtering
planSchema.index({ product: 1, isActive: 1 });
planSchema.index({ billingCycle: 1, isActive: 1 });
planSchema.index({ createdBy: 1 });

const planModel = mongoose.model("Plan", planSchema);

export default planModel;
