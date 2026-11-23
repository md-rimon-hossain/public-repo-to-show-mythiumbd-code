import mongoose, { Schema, Document, Model } from "mongoose";

export interface IColorVariantDoc {
  colorName: string;
  colorHex: string;
  stock: number;
  sku: string;
}

export interface ISizeVariantDoc {
  size: string;
  colors: IColorVariantDoc[];
}

export interface IProductDocument extends Document {
  name: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  images: string[];
  video?: string;
  category: mongoose.Types.ObjectId;
  regularPrice: number;
  discountPrice: number;
  totalSave: number;
  savePercentage: number;
  isTrending: boolean;
  isNewProduct: boolean;
  totalQuantity: number;
  variants: ISizeVariantDoc[];
  status: "active" | "draft" | "archived";
  sizeChartImage?: string;
  sizeChartTitle?: string;
  sizeChartDescription?: string;
  fitAndStyle?: string;
  howToMeasure?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ColorVariantSchema = new Schema<IColorVariantDoc>(
  {
    colorName: {
      type: String,
      required: [true, "Color name is required for each variant"],
      trim: true,
    },
    colorHex: {
      type: String,
      required: [true, "Color hex code is required (e.g., #FF0000)"],
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color hex must be a valid hex color code (e.g., #FF0000 or #F00)"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required for each color variant"],
      min: [0, "Stock cannot be negative. Please enter 0 or a positive number."],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number (integer), not a decimal. You provided: {VALUE}",
      },
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  { _id: true }
);

const SizeVariantSchema = new Schema<ISizeVariantDoc>(
  {
    size: {
      type: String,
      required: [true, "Size is required for each variant"],
      trim: true,
    },
    colors: {
      type: [ColorVariantSchema],
      validate: {
        validator: function (v: IColorVariantDoc[]) {
          return v.length > 0;
        },
        message: "Each size must have at least one color variant with stock information",
      },
    },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, "Product name is required (e.g., 'T-shirt', 'Shirt', 'Pant')"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters long"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    title: {
      type: String,
      required: [true, "Product title is required (e.g., 'Premium Cotton Casual T-Shirt')"],
      trim: true,
      minlength: [3, "Product title must be at least 3 characters long"],
      maxlength: [200, "Product title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required. Provide a detailed description to help customers."],
      minlength: [10, "Product description must be at least 10 characters. Provide more detail about the product."],
    },
    keywords: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 20;
        },
        message: "You can add up to 20 keywords maximum. You have {VALUE} keywords.",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    video: {
      type: String,
      default: undefined,
    },
    sizeChartImage: {
      type: String,
      default: undefined,
    },
    sizeChartTitle: {
      type: String,
      default: undefined,
      trim: true,
      maxlength: [200, "Size chart title cannot exceed 200 characters"],
    },
    sizeChartDescription: {
      type: String,
      default: undefined,
      maxlength: [2000, "Size chart description cannot exceed 2000 characters"],
    },
    fitAndStyle: {
      type: String,
      default: undefined,
    },
    howToMeasure: {
      type: String,
      default: undefined,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required. Please select a category."],
    },
    regularPrice: {
      type: Number,
      required: [true, "Regular price is required"],
      min: [1, "Regular price must be at least ৳1. You provided: {VALUE}"],
    },
    discountPrice: {
      type: Number,
      required: [true, "Discount price is required. Set it equal to regular price if there is no discount."],
      min: [0, "Discount price cannot be negative. You provided: {VALUE}"],
      validate: {
        validator: function (this: IProductDocument, v: number) {
          return v <= this.regularPrice;
        },
        message: "Discount price (৳{VALUE}) cannot be greater than the regular price",
      },
    },
    totalSave: { type: Number, default: 0 },
    savePercentage: { type: Number, default: 0 },
    isTrending: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: true },
    totalQuantity: { type: Number, default: 0 },
    variants: {
      type: [SizeVariantSchema],
      validate: {
        validator: function (v: ISizeVariantDoc[]) {
          return v.length > 0;
        },
        message:
          "At least one size variant is required. Add sizes with colors and stock for this product.",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["active", "draft", "archived"],
        message: "Product status must be one of: active, draft, archived. You provided: {VALUE}",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate totalSave, savePercentage, and totalQuantity before save
ProductSchema.pre("save", function (next) {
  // Calculate savings
  this.totalSave = this.regularPrice - this.discountPrice;
  this.savePercentage =
    this.regularPrice > 0
      ? Math.round(((this.regularPrice - this.discountPrice) / this.regularPrice) * 100)
      : 0;

  // Calculate total quantity from all variants
  this.totalQuantity = this.variants.reduce((total, sizeVariant) => {
    return (
      total +
      sizeVariant.colors.reduce((colorTotal, colorVariant) => {
        return colorTotal + colorVariant.stock;
      }, 0)
    );
  }, 0);

  // Validate: at least one image or one video
  if ((!this.images || this.images.length === 0) && !this.video) {
    const err = new Error(
      "At least one product image or one video is required. You must upload either images, a video, or both."
    );
    return next(err);
  }

  next();
});

ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isTrending: 1, status: 1 });
ProductSchema.index({ createdAt: -1, status: 1 });
ProductSchema.index({ discountPrice: 1 });
ProductSchema.index({ "variants.size": 1 });
ProductSchema.index({ "variants.colors.colorName": 1 });

const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;

export { Product };
