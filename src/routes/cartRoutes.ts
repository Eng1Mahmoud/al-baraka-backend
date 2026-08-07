import { Router } from "express";
import { validateCart } from "../controllers/cartController.js";

const router = Router();

// Public: guests need fresh prices and stock for the cart they hold in the browser.
router.post("/validate", validateCart);

export default router;
