import { Router } from "express";
import {
  createOrder,
  trackOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getStats,
} from "../controllers/orderController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// Public — guest checkout and order tracking
router.post("/", createOrder);
router.get("/track", trackOrder);

// Dashboard
router.get("/", protect, getOrders);
router.get("/stats", protect, getStats);
router.get("/:id", protect, getOrder);
router.patch("/:id/status", protect, updateOrderStatus);
router.patch("/:id/payment", protect, updatePaymentStatus);

export default router;
