import { FilterQuery, SortOrder } from "mongoose";
import Product, { IProduct } from "../models/Product.js";
import Category from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { uniqueSlug } from "../utils/slugify.js";

interface ProductInput {
  name: string;
  description?: string;
  category: string;
  price: number;
  discountPrice?: number;
  unit: string;
  stock: number;
  images?: string[];
  isAvailable?: boolean;
}

export type ProductSort = "newest" | "price-asc" | "price-desc" | "name";

interface ListQuery {
  category?: string; // category slug
  search?: string;
  page?: number;
  limit?: number;
  availableOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
}

const SORT_OPTIONS: Record<ProductSort, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  name: { name: 1 },
};

class ProductService {
  async list({
    category,
    search,
    page = 1,
    limit = 20,
    availableOnly = false,
    minPrice,
    maxPrice,
    sort = "newest",
  }: ListQuery) {
    const filter: FilterQuery<IProduct> = {};

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (!categoryDoc) throw ApiError.notFound("التصنيف غير موجود");
      filter.category = categoryDoc._id;
    }

    if (search) filter.name = { $regex: escapeRegex(search.trim()), $options: "i" };
    if (availableOnly) filter.isAvailable = true;

    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = minPrice;
      if (maxPrice != null) filter.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(SORT_OPTIONS[sort] ?? SORT_OPTIONS.newest)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit) || 1;
    return { items, total, page, pages, hasMore: page < pages };
  }

  async homeSections(perCategory = 8) {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });

    const sections = await Promise.all(
      categories.map(async (category) => ({
        category,
        products: await Product.find({ category: category._id })
          .populate("category", "name slug")
          .sort({ isAvailable: -1, createdAt: -1 })
          .limit(perCategory),
      }))
    );

    // A category with no products at all would render an empty row.
    return sections.filter((section) => section.products.length > 0);
  }

  /** Cheapest and most expensive product, so the filter slider knows its bounds. */
  async priceBounds() {
    const [result] = await Product.aggregate<{ min: number; max: number }>([
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]);

    return { min: result?.min ?? 0, max: result?.max ?? 0 };
  }

  async getById(id: string) {
    const product = await Product.findById(id).populate("category", "name slug");
    if (!product) throw ApiError.notFound("المنتج غير موجود");
    return product;
  }

  async getBySlug(slug: string) {
    const product = await Product.findOne({ slug }).populate("category", "name slug");
    if (!product) throw ApiError.notFound("المنتج غير موجود");
    return product;
  }

  async create(data: ProductInput) {
    await this.assertCategoryExists(data.category);
    this.assertPricing(data.price, data.discountPrice);
    return Product.create({ ...data, slug: uniqueSlug(data.name) });
  }

  async update(id: string, data: Partial<ProductInput>) {
    if (data.category) await this.assertCategoryExists(data.category);

    const existing = await Product.findById(id);
    if (!existing) throw ApiError.notFound("المنتج غير موجود");

    this.assertPricing(data.price ?? existing.price, data.discountPrice ?? existing.discountPrice);

    // Caught here as well as in the model hook: switching a product back on without
    // touching its stock sends no stock field at all, so the hook has nothing to read.
    if ((data.stock ?? existing.stock) === 0) data.isAvailable = false;

    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      "category",
      "name slug"
    );
    return product;
  }

  async remove(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw ApiError.notFound("المنتج غير موجود");
  }

  private async assertCategoryExists(categoryId: string) {
    const exists = await Category.exists({ _id: categoryId });
    if (!exists) throw ApiError.badRequest("التصنيف المحدد غير موجود");
  }

  private assertPricing(price: number, discountPrice?: number) {
    if (discountPrice != null && discountPrice >= price) {
      throw ApiError.badRequest("سعر الخصم يجب أن يكون أقل من السعر الأساسي");
    }
  }
}

export const productService = new ProductService();
