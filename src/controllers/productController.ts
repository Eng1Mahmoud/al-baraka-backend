import { Response } from "express";
import { productService, type ProductSort } from "../services/productService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getProducts = asyncHandler(async (req, res: Response) => {
  const { category, search, page, limit, availableOnly, minPrice, maxPrice, sort } = req.query;

  res.json(
    await productService.list({
      category: category as string | undefined,
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      availableOnly: availableOnly === "true",
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as ProductSort | undefined,
    })
  );
});

/** Home page: every category with its newest products, in one request. */
export const getHomeSections = asyncHandler(async (_req, res: Response) => {
  res.json(await productService.homeSections());
});

export const getPriceBounds = asyncHandler(async (_req, res: Response) => {
  res.json(await productService.priceBounds());
});

export const getProduct = asyncHandler<IdParam>(async (req, res: Response) => {
  res.json(await productService.getById(req.params.id));
});

export const getProductBySlug = asyncHandler<{ slug: string }>(async (req, res: Response) => {
  res.json(await productService.getBySlug(req.params.slug));
});

export const createProduct = asyncHandler(async (req, res: Response) => {
  const { name, description, category, price, discountPrice, unit, stock, images, isAvailable } = req.body;

  if (!name || !category || price == null || !unit) {
    throw ApiError.badRequest("الاسم والتصنيف والسعر والوحدة حقول مطلوبة");
  }

  res.status(201).json(
    await productService.create({
      name,
      description,
      category,
      price: Number(price),
      discountPrice: discountPrice != null ? Number(discountPrice) : undefined,
      unit,
      stock: Number(stock ?? 0),
      images,
      isAvailable,
    })
  );
});

export const updateProduct = asyncHandler<IdParam>(async (req, res: Response) => {
  res.json(await productService.update(req.params.id, req.body));
});

export const deleteProduct = asyncHandler<IdParam>(async (req, res: Response) => {
  await productService.remove(req.params.id);
  res.json({ message: "تم حذف المنتج" });
});
