import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { uniqueSlug } from "../utils/slugify.js";

interface CategoryInput {
  name: string;
  image?: string;
  order?: number;
}

class CategoryService {
  async getAll() {
    return Category.find().sort({ order: 1, createdAt: 1 });
  }

  async create(data: CategoryInput) {
    return Category.create({ ...data, slug: uniqueSlug(data.name) });
  }

  async update(id: string, data: Partial<CategoryInput>) {
    const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!category) throw ApiError.notFound("التصنيف غير موجود");
    return category;
  }

  async remove(id: string) {
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw ApiError.conflict(`لا يمكن حذف التصنيف لأنه يحتوي على ${productCount} منتج`);
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) throw ApiError.notFound("التصنيف غير موجود");
  }
}

export const categoryService = new CategoryService();
