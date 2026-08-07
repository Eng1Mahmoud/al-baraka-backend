import { uploadToSirv } from "../config/sirv.js";
import { ApiError } from "../utils/ApiError.js";

class UploadService {
  async uploadOne(file?: Express.Multer.File): Promise<string> {
    if (!file) throw ApiError.badRequest("لم يتم اختيار صورة");
    return uploadToSirv(file.buffer, file.originalname || "upload.jpg");
  }

  async uploadMany(files?: Express.Multer.File[]): Promise<string[]> {
    if (!files?.length) throw ApiError.badRequest("لم يتم اختيار صور");
    return Promise.all(files.map((file) => uploadToSirv(file.buffer, file.originalname || "upload.jpg")));
  }
}

export const uploadService = new UploadService();
