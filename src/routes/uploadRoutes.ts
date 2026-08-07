import { Router } from "express";
import { uploadImage, uploadImages } from "../controllers/uploadController.js";
import { upload } from "../middlewares/uploadImages.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.post("/", upload.single("image"), uploadImage);
router.post("/multiple", upload.array("images", 6), uploadImages);

export default router;
