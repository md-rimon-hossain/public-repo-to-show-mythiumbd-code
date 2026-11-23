import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStoreSettingsDocument extends Document {
  paymentOptions: {
    fullBkash: boolean;
    codWithAdvance: boolean;
    fullCod: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettingsDocument>(
  {
    paymentOptions: {
      fullBkash: { type: Boolean, default: true },
      codWithAdvance: { type: Boolean, default: true },
      fullCod: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const StoreSettings: Model<IStoreSettingsDocument> =
  mongoose.models.StoreSettings || mongoose.model<IStoreSettingsDocument>("StoreSettings", StoreSettingsSchema);

export default StoreSettings;

export { StoreSettings };
