import { Router } from "express";
import {
  getDeliveryAreas,
  createDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,
} from "../controllers/deliveryAreaController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// Public — the checkout form needs the list to let the customer pick.
router.get("/", getDeliveryAreas);

router.post("/", protect, createDeliveryArea);
router.patch("/:id", protect, updateDeliveryArea);
router.delete("/:id", protect, deleteDeliveryArea);

export default router;
