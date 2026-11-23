import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHeaderLinkDocument extends Document {
  title: string;
  href: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  parentId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const HeaderLinkSchema = new Schema<IHeaderLinkDocument>(
  {
    title: {
      type: String,
      required: [true, "Link title is required (e.g., 'Home', 'Products', 'About Us')"],
      trim: true,
      maxlength: [50, "Link title cannot exceed 50 characters"],
    },
    href: {
      type: String,
      required: [true, "Link URL is required (e.g., '/', '/products', 'https://example.com')"],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, "Display order cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "HeaderLink",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

HeaderLinkSchema.index({ parentId: 1, order: 1 });
HeaderLinkSchema.index({ isActive: 1 });

HeaderLinkSchema.virtual("children", {
  ref: "HeaderLink",
  localField: "_id",
  foreignField: "parentId",
});

const HeaderLink: Model<IHeaderLinkDocument> =
  mongoose.models.HeaderLink || mongoose.model<IHeaderLinkDocument>("HeaderLink", HeaderLinkSchema);

// Both exports so either import style works across your codebase
export { HeaderLink };
export default HeaderLink;