import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["unread", "read", "replied"], default: "unread" },
    replies: [
      {
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const SupportMessage = mongoose.models.SupportMessage || mongoose.model("SupportMessage", supportMessageSchema);
export default SupportMessage;
