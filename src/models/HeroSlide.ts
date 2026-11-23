import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHeroSlideDocument extends Document {
  image: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideSchema = new Schema<IHeroSlideDocument>(
  {
    image: {
      type: String,
      required: [true, "Hero slide image is required. Please upload a 16:9 aspect ratio image."],
    },
    title: { type: String, trim: true, maxlength: [100, "Slide title cannot exceed 100 characters"] },
    subtitle: { type: String, trim: true, maxlength: [200, "Slide subtitle cannot exceed 200 characters"] },
    ctaText: { type: String, trim: true, maxlength: [30, "CTA button text cannot exceed 30 characters"] },
    ctaLink: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HeroSlideSchema.index({ order: 1 });

const HeroSlide: Model<IHeroSlideDocument> =
  mongoose.models.HeroSlide || mongoose.model<IHeroSlideDocument>("HeroSlide", HeroSlideSchema);

export default HeroSlide;

export { HeroSlide };
