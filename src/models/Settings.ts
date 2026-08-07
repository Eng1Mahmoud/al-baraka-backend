import { Schema, model, Document } from "mongoose";

// Singleton document — there is always exactly one Settings row, upserted on write.
// Delivery pricing deliberately lives in DeliveryArea, not here: every order is
// priced by the area the customer picks.
export interface ISettings extends Document {
  storeName: string;
  storePhone: string;
  workingHours: string;
  units: string[];
}

const settingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "البركة" },
    storePhone: { type: String, default: "" },
    workingHours: { type: String, default: "" },
    units: { type: [String], default: ["كجم", "قطعة", "نصف كيلو", "ربع كيلو", "صينية"] },
  },
  { timestamps: true }
);

export default model<ISettings>("Settings", settingsSchema);
