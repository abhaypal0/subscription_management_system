
import mongoose from "mongoose";

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    taxType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return this.taxType !== "percentage" || value <= 100;
        },
        message: "Percentage tax rate cannot exceed 100.",
      },
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    startDate: {
      type: Date,
      default: Date.now,
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

// Improve tax filtering
taxSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
taxSchema.index({ applicableProducts: 1 });
taxSchema.index({ createdBy: 1 });

const taxModel = mongoose.model("Tax", taxSchema);

export default taxModel;
