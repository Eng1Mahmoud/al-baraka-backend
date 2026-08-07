import { Router } from "express";
import { getPublicKey, subscribe, unsubscribe, sendTest } from "../controllers/pushController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/public-key", getPublicKey);
router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);
router.post("/test", protect, sendTest);

export default router;
