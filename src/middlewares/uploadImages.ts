import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per image

/** Keeps files in memory so they can be streamed straight to Sirv without touching disk. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(ApiError.badRequest("الملف المرفوع يجب أن يكون صورة"));
    }
    return cb(null, true);
  },
});
