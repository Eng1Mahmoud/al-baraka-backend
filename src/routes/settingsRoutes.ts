import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// Public — the storefront reads delivery fee, phone and working hours.
router.get("/", getSettings);
router.patch("/", protect, updateSettings);

export default router;
