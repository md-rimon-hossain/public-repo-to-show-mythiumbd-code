import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  image: string;
  categoryType: "shirt" | "half_shirt" | "tshirt" | "pant" | "shorts" | "custom";
  sizes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORY_SIZES: Record<string, string[]> = {
  shirt: ["S", "M", "L", "XL", "XXL", "XXXL"],
  half_shirt: ["S", "M", "L", "XL", "XXL", "XXXL"],
  tshirt: ["S", "M", "L", "XL", "XXL", "XXXL"],
  pant: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
  shorts: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
  custom: [],
};

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters long"],
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Category image is required. Please upload an image for this category."],
    },
    categoryType: {
      type: String,
      enum: {
        values: ["shirt", "half_shirt", "tshirt", "pant", "shorts", "custom"],
        message:
          "Category type must be one of: shirt, half_shirt, tshirt, pant, shorts, custom. You provided: {VALUE}",
      },
      required: [true, "Category type is required to auto-assign available sizes"],
    },
    sizes: {
      type: [String],
      default: function (this: ICategoryDocument) {
        return CATEGORY_SIZES[this.categoryType] || [];
      },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

CategorySchema.pre("save", function (next) {
  if (this.isModified("categoryType") && this.categoryType !== "custom") {
    this.sizes = CATEGORY_SIZES[this.categoryType] || [];
  }
  next();
});

CategorySchema.index({ isActive: 1 });

const Category: Model<ICategoryDocument> =
  mongoose.models.Category || mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;

export { Category };
