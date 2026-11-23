import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICouponDocument extends Document {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required (e.g., 'SAVE10', 'WELCOME20')"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters long"],
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
      match: [/^[A-Z0-9]+$/, "Coupon code can only contain uppercase letters and numbers"],
    },
    discountType: {
      type: String,
      enum: {
        values: ["percentage", "fixed"],
        message: "Discount type must be either 'percentage' (e.g., 10% off) or 'fixed' (e.g., ৳100 off). You provided: {VALUE}",
      },
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [1, "Discount value must be at least 1"],
      validate: {
        validator: function (this: ICouponDocument, v: number) {
          if (this.discountType === "percentage" && v > 100) return false;
          return true;
        },
        message: "Percentage discount cannot exceed 100%. You provided: {VALUE}%",
      },
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maxUses: {
      type: Number,
      default: -1,
      validate: {
        validator: function (v: number) {
          return v === -1 || v >= 1;
        },
        message: "Max uses must be -1 (unlimited) or at least 1",
      },
    },
    currentUses: { type: Number, default: 0, min: 0 },
    expiresAt: {
      type: Date,
      required: [true, "Expiry date is required. Please set when this coupon should expire."],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ isActive: 1, expiresAt: 1 });

const Coupon: Model<ICouponDocument> =
  mongoose.models.Coupon || mongoose.model<ICouponDocument>("Coupon", CouponSchema);

export default Coupon;

export { Coupon };
