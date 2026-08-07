import { Schema, model, Document, Types } from "mongoose";
import { OrderStatus, PaymentStatus } from "../types/index.js";

export interface IOrderItem {
  product: Types.ObjectId;
  name: string; // snapshot at order time
  price: number; // snapshot at order time
  unit: string;
  quantity: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    notes?: string;
  };
  items: IOrderItem[];
  /** Snapshot of the area chosen at checkout — its price may change later. */
  deliveryArea?: {
    area: Types.ObjectId;
    name: string;
    price: number;
  };
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "cash_on_delivery";
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String },
      notes: { type: String },
    },
    items: { type: [orderItemSchema], required: true, validate: (v: IOrderItem[]) => v.length > 0 },
    deliveryArea: {
      area: { type: Schema.Types.ObjectId, ref: "DeliveryArea" },
      name: { type: String },
      price: { type: Number },
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["cash_on_delivery"], default: "cash_on_delivery" },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  },
  { timestamps: true }
);

export default model<IOrder>("Order", orderSchema);
