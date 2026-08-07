import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: `المسار غير موجود: ${req.originalUrl}` });
};

export const errorHandler = (
  err: Error & { statusCode?: number; code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Duplicate key (e.g. an email or slug that already exists)
  if (err.code === 11000) {
    return res.status(409).json({ message: "هذا العنصر موجود بالفعل" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "حدث خطأ في الخادم" });
};
