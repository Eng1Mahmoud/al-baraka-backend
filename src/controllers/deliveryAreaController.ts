import { Response } from "express";
import { deliveryAreaService } from "../services/deliveryAreaService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getDeliveryAreas = asyncHandler(async (req, res: Response) => {
  // The storefront asks for ?activeOnly=true; the dashboard lists everything.
  res.json(await deliveryAreaService.list(req.query.activeOnly === "true"));
});

export const createDeliveryArea = asyncHandler(async (req, res: Response) => {
  const { name, price, isActive, order } = req.body;
  if (!name || price == null) throw ApiError.badRequest("اسم المنطقة وسعر التوصيل مطلوبان");

  res.status(201).json(
    await deliveryAreaService.create({
      name,
      price: Number(price),
      isActive,
      order: order != null ? Number(order) : undefined,
    })
  );
});

export const updateDeliveryArea = asyncHandler<IdParam>(async (req, res: Response) => {
  const { name, price, isActive, order } = req.body;

  res.json(
    await deliveryAreaService.update(req.params.id, {
      name,
      price: price != null ? Number(price) : undefined,
      isActive,
      order: order != null ? Number(order) : undefined,
    })
  );
});

export const deleteDeliveryArea = asyncHandler<IdParam>(async (req, res: Response) => {
  await deliveryAreaService.remove(req.params.id);
  res.json({ message: "تم حذف المنطقة" });
});
