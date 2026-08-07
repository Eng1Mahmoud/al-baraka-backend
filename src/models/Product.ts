import { Schema, model, Document, Types } from "mongoose";

// The unit list itself is admin-editable via Settings, this is just the stored value on the product.
export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  category: Types.ObjectId;
  price: number;
  discountPrice?: number;
  unit: string; // e.g. "كجم", "قطعة" — free text driven by Settings.units
  stock: number;
  images: string[];
  isAvailable: boolean;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" }, { default_language: "none" });

export default model<IProduct>("Product", productSchema);
