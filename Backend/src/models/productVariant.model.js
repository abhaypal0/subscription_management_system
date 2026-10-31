
import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    variantName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    variantValue: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    additionalPrice: {
      type: Number,
      default: 0,
      min: 0,
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

// Improve variant filtering by product
productVariantSchema.index({ product: 1, isActive: 1 });

// Prevent duplicate active variant names and values for the same product
productVariantSchema.index(
  { product: 1, variantName: 1, variantValue: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

const productVariantModel = mongoose.model(
  "ProductVariant",
  productVariantSchema
);

export default productVariantModel;
