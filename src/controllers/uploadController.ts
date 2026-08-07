import { Response } from "express";
import { uploadService } from "../services/uploadService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadImage = asyncHandler(async (req, res: Response) => {
  const url = await uploadService.uploadOne(req.file);
  res.status(201).json({ url });
});

export const uploadImages = asyncHandler(async (req, res: Response) => {
  const urls = await uploadService.uploadMany(req.files as Express.Multer.File[]);
  res.status(201).json({ urls });
});
