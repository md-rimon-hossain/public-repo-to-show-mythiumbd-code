import mongoose, { Schema, Document, Model } from "mongoose";

export interface INewsletterDocument extends Document {
  email: string;
  isSubscribed: boolean;
  subscribedAt: Date;
}

const NewsletterSchema = new Schema<INewsletterDocument>({
  email: {
    type: String,
    required: [true, "Email address is required to subscribe to the newsletter"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address (e.g., you@example.com)"],
  },
  isSubscribed: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
});

NewsletterSchema.index({ isSubscribed: 1 });

const Newsletter: Model<INewsletterDocument> =
  mongoose.models.Newsletter || mongoose.model<INewsletterDocument>("Newsletter", NewsletterSchema);

export default Newsletter;

export { Newsletter };
