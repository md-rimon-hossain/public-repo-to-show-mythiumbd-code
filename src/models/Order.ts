import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItemDoc {
  product: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
  regularPrice: number;
  discountPrice: number;
  totalPrice: number;
}

export interface IOrderDocument extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItemDoc[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    village: string;
    upazila: string;
    zila: string;
    division: string;
  };
  deliveryZone: "inside_dhaka" | "outside_dhaka" | "inside_kushtia";
  deliveryCharge: number;
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  totalAmount: number;
  paymentMethod: "bkash" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "delivery_paid";
  bkashPaymentId?: string;
  bkashTransactionId?: string;
  bkashPaymentType?: "full_payment" | "delivery_charge";
  bkashAmountPaid?: number;
  orderStatus: "pending" | "in_review" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
  steadfastConsignmentId?: string;
  steadfastTrackingCode?: string;
  steadfastTrackingLink?: string;
  steadfastStatus?: string;
  invoice: string;
  notes?: string;
  isCustomAdminOrder?: boolean;
  steadfastTrackingHistory?: {
    status: string;
    message: string;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItemDoc>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required for each order item"],
    },
    productName: {
      type: String,
      required: [true, "Product name snapshot is required for order history"],
    },
    productImage: {
      type: String,
      required: [true, "Product image is required for order display"],
    },
    size: {
      type: String,
      required: [true, "Size selection is required. Please select a size before ordering."],
    },
    color: {
      type: String,
      required: [true, "Color selection is required. Please select a color before ordering."],
    },
    colorHex: { type: String, required: true },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    regularPrice: {
      type: Number,
      required: true,
      min: [0, "Regular price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      required: true,
      min: [0, "Discount price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required. Please sign in to place an order."],
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: function (v: IOrderItemDoc[]) {
          return v.length > 0;
        },
        message: "Order must have at least one item. Your cart appears to be empty.",
      },
    },
    shippingAddress: {
      fullName: {
        type: String,
        required: [true, "Full name is required for delivery"],
        trim: true,
        minlength: [2, "Full name must be at least 2 characters"],
      },
      phone: {
        type: String,
        required: [true, "Mobile number is required for delivery updates and courier contact"],
        trim: true,
        match: [/^01[3-9]\d{8}$/, "Please provide a valid Bangladeshi mobile number (e.g., 01712345678)"],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      },
      village: {
        type: String,
        required: [true, "Village/Area is required for accurate delivery"],
        trim: true,
      },
      upazila: {
        type: String,
        required: [true, "Upazila/Thana is required for delivery routing"],
        trim: true,
      },
      zila: {
        type: String,
        required: [true, "Zila/District is required for delivery zone calculation"],
        trim: true,
      },
      division: {
        type: String,
        required: false,
        trim: true,
      },
    },
    deliveryZone: {
      type: String,
      enum: {
        values: ["inside_dhaka", "outside_dhaka", "inside_kushtia"],
        message: "Delivery zone must be either 'inside_dhaka', 'outside_dhaka', or 'inside_kushtia'",
      },
      required: [true, "Please select your delivery zone"],
    },
    deliveryCharge: {
      type: Number,
      required: true,
      enum: {
        values: [0, 60, 110, 130],
        message: "Delivery charge must be ৳0 (Free), ৳110 (Inside Dhaka), ৳130 (Outside Dhaka), or ৳60 (Inside Kushtia)",
      },
    },
    subtotal: { type: Number, required: true, min: [0, "Subtotal cannot be negative"] },
    couponCode: { type: String, trim: true, uppercase: true },
    couponDiscount: { type: Number, default: 0, min: [0, "Coupon discount cannot be negative"] },
    totalAmount: {
      type: Number,
      required: true,
      min: [1, "Total amount must be at least ৳1"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["bkash", "cod"],
        message: "Payment method must be either 'bkash' (Online Payment) or 'cod' (Cash on Delivery)",
      },
      required: [true, "Please select a payment method"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "delivery_paid"],
      default: "pending",
    },
    bkashPaymentId: { type: String },
    bkashTransactionId: { type: String },
    bkashPaymentType: { type: String, enum: ["full_payment", "delivery_charge"] },
    bkashAmountPaid: { type: Number },
    orderStatus: {
      type: String,
      enum: ["pending", "in_review", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
      default: "pending",
    },
    steadfastConsignmentId: { type: String },
    steadfastTrackingCode: { type: String },
    steadfastTrackingLink: { type: String },
    steadfastStatus: { type: String },
    invoice: {
      type: String,
      required: true,
      unique: true,
    },
    notes: { type: String, maxlength: [500, "Order notes cannot exceed 500 characters"] },
    isCustomAdminOrder: { type: Boolean, default: false },
    steadfastTrackingHistory: [
      {
        status: { type: String },
        message: { type: String },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ steadfastConsignmentId: 1 });

delete mongoose.models.Order;
const Order: Model<IOrderDocument> = mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;

export { Order };
