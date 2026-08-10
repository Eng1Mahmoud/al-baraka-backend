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

/*
 * Stock is a fact, `isAvailable` is a claim — and a product with nothing on the shelf
 * cannot be claimed as available whatever the admin last toggled. Enforced on the model
 * rather than at each call site so no write path can leave a sold-out product on sale.
 *
 * Only this direction is automatic. Restocking does not put a product back on sale:
 * a shop owner may have hidden it deliberately, and this cannot tell the two apart.
 */
productSchema.pre("save", function (next) {
  if (this.stock === 0) this.isAvailable = false;
  next();
});

productSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  const update = this.getUpdate();

  // An aggregation-pipeline update computes the new stock from the old one, so it has
  // to settle availability itself — see orderService.reserveStock.
  if (!update || Array.isArray(update)) return next();

  const nextStock = update.$set?.stock ?? update.stock;
  if (nextStock === 0) this.set({ isAvailable: false });

  next();
});

export default model<IProduct>("Product", productSchema);
