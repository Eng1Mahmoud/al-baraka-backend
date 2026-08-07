import { Response } from "express";
import { cartService } from "../services/cartService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const validateCart = asyncHandler(async (req, res: Response) => {
  const { items, deliveryAreaId } = req.body;
  if (!Array.isArray(items)) throw ApiError.badRequest("السلة غير صحيحة");

  res.json(await cartService.validate(items, deliveryAreaId));
});
