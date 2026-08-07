import { Schema, model, Document } from "mongoose";

/** A place the shop delivers to, with its own delivery price. */
export interface IDeliveryArea extends Document {
  name: string;
  price: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

const deliveryAreaSchema = new Schema<IDeliveryArea>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<IDeliveryArea>("DeliveryArea", deliveryAreaSchema);
