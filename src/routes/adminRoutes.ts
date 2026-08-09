import { Router } from "express";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/adminController.js";
import { protect, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Managing admin accounts is superadmin-only.
router.use(protect, requireRole("superadmin"));

router.get("/", getAdmins);
router.post("/", createAdmin);
router.patch("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);

export default router;
