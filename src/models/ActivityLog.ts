import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLogDocument extends Document {
  user?: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "login", "logout", "block", "unblock", "payment", "refund", "ship", "deliver", "other"],
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: { type: String },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1 });

const ActivityLog: Model<IActivityLogDocument> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLogDocument>("ActivityLog", ActivityLogSchema);

export default ActivityLog;

export { ActivityLog };
