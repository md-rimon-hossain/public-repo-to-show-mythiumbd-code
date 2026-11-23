import mongoose from "mongoose";

const pageViewSchema = new mongoose.Schema({
  path: { type: String, required: true },
  visitorId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  createdAt: { type: Date, default: Date.now, expires: 2592000 } // 30 days in seconds
});

export const PageView = mongoose.models.PageView || mongoose.model("PageView", pageViewSchema);

export default PageView;
