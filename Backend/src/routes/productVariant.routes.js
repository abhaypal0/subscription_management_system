import express from "express";

import {
  createProductVariantController,
  getProductVariantByIdController,
  updateProductVariantController,
  deactivateProductVariantController,
} from "../controllers/productVariant.controller.js";

import { authUser } from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Require login for every endpoint
router.use(authUser);

// Create a variant for a product (Admin only)
router.post(
  "/:productId",
  authorizeRoles("admin"),
  createProductVariantController
);

// Get variants belonging to a product (all roles)
router.get(
  "/:productId",
  authorizeRoles("admin", "staff", "customer"),
  getProductVariantByIdController
);

// Update a variant (Admin only)
router.patch(
  "/:variantId",
  authorizeRoles("admin"),
  updateProductVariantController
);

// Deactivate a variant (Admin only)
router.delete(
  "/:variantId",
  authorizeRoles("admin"),
  deactivateProductVariantController
);

export default router;