
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    type: {
      type: String,
      required: true,
      enum: ["software", "service", "addon", "other"],
    },

    salesPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    variants: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        value: {
          type: String,
          required: true,
          trim: true,
        },

        additionalPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],

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

// Improve product searching and filtering
productSchema.index({ name: 1 });
productSchema.index({ type: 1, isActive: 1 });
productSchema.index({ createdBy: 1 });

const productModel = mongoose.model("Product", productSchema);

export default productModel;
