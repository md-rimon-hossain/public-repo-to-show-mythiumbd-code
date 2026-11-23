import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISignaturePickDocument extends Document {
  image: string;
  link?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SignaturePickSchema = new Schema<ISignaturePickDocument>(
  {
    image: {
      type: String,
      required: [true, "Image is required."],
    },
    link: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SignaturePickSchema.index({ order: 1 });

const SignaturePick: Model<ISignaturePickDocument> =
  mongoose.models.SignaturePick || mongoose.model<ISignaturePickDocument>("SignaturePick", SignaturePickSchema);

export default SignaturePick;

export { SignaturePick };
