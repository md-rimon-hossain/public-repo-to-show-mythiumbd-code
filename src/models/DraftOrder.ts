import mongoose, { Schema, Document, Model } from "mongoose";
import { IOrderItemDoc } from "./Order";

export interface IDraftOrderDocument extends Document {
  linkId: string;
  items: IOrderItemDoc[];
  subtotal: number;
  manualDiscount: number;
  deliveryChargeOverride: number | null; // null means auto-calculate
  totalAmount: number;
  prefilledCustomerDetails: {
    fullName?: string;
    phone?: string;
    email?: string;
    village?: string;
    upazila?: string;
    zila?: string;
    deliveryZone?: "inside_dhaka" | "outside_dhaka" | "inside_kushtia";
  };
  paymentMethod: "cod" | "bkash";
  paymentStatus: "pending" | "paid" | "delivery_paid" | "failed" | "refunded";
  status: "active" | "completed";
  adminCreator?: mongoose.Types.ObjectId;
  convertedOrderId?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Re-using the Item Schema logic but without strict imports since OrderItemSchema is not exported in Order.ts.
// Let's copy it here so it's standalone, or we can just define it.
const DraftOrderItemSchema = new Schema<IOrderItemDoc>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    productImage: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    colorHex: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    regularPrice: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const DraftOrderSchema = new Schema<IDraftOrderDocument>(
  {
    linkId: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [DraftOrderItemSchema],
      validate: {
        validator: function (v: IOrderItemDoc[]) {
          return v.length > 0;
        },
        message: "Draft Order must have at least one item.",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    manualDiscount: { type: Number, default: 0, min: 0 },
    deliveryChargeOverride: { type: Number, default: null },
    totalAmount: { type: Number, required: true, min: 1 },
    prefilledCustomerDetails: {
      fullName: { type: String, trim: true },
      phone: { type: String },
      email: { type: String, trim: true, lowercase: true },
      village: { type: String, trim: true },
      upazila: { type: String, trim: true },
      zila: { type: String, trim: true },
      deliveryZone: {
        type: String,
        enum: ["inside_dhaka", "outside_dhaka", "inside_kushtia"],
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "bkash"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "delivery_paid", "failed", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    adminCreator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    convertedOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

delete mongoose.models.DraftOrder;
const DraftOrder: Model<IDraftOrderDocument> = mongoose.model<IDraftOrderDocument>("DraftOrder", DraftOrderSchema);

export default DraftOrder;

export { DraftOrder };
