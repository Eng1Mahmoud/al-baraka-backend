import { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// Public — the storefront needs the category list.
router.get("/", getCategories);
router.get("/:id", getCategory);

// Dashboard
router.post("/", protect, createCategory);
router.patch("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

export default router;
