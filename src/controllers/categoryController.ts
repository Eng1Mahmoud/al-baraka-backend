import { Response } from "express";
import { categoryService } from "../services/categoryService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getCategories = asyncHandler(async (_req, res: Response) => {
  res.json(await categoryService.getAll());
});

export const getCategory = asyncHandler<IdParam>(async (req, res: Response) => {
  res.json(await categoryService.getById(req.params.id));
});

export const createCategory = asyncHandler(async (req, res: Response) => {
  const { name, image, order } = req.body;
  if (!name) throw ApiError.badRequest("اسم التصنيف مطلوب");

  res.status(201).json(await categoryService.create({ name, image, order }));
});

export const updateCategory = asyncHandler<IdParam>(async (req, res: Response) => {
  const { name, image, order } = req.body;
  res.json(await categoryService.update(req.params.id, { name, image, order }));
});

export const deleteCategory = asyncHandler<IdParam>(async (req, res: Response) => {
  await categoryService.remove(req.params.id);
  res.json({ message: "تم حذف التصنيف" });
});
