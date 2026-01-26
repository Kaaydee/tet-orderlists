import mongoose, { Schema, models } from "mongoose";

export interface IOrder {
  customerName: string;
  product: string;
  quantity: number;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerName: String,
    product: String,
    quantity: Number,
  },
  { timestamps: true }
);

export const Order =
  models.Order || mongoose.model<IOrder>("Order", OrderSchema);
