import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  role: "user" | "admin" | "superadmin";
  phone?: string;
  address?: {
    village: string;
    upazila: string;
    zila: string;
    division: string;
  };
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    emailVerified: { type: Date },
    image: { type: String },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "superadmin"],
        message: "Role must be one of: user, admin, superadmin. You provided: {VALUE}",
      },
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
      match: [/^01[3-9]\d{8}$/, "Phone number must be a valid Bangladeshi mobile number (e.g., 01712345678)"],
    },
    address: {
      village: { type: String, trim: true },
      upazila: { type: String, trim: true },
      zila: { type: String, trim: true },
      division: { type: String, trim: true },
    },
    isBlocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1 });

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;

export { User };
