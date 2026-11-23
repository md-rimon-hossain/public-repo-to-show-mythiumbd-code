import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { PageView } from "@/models/PageView";
import Product from "@/models/Product";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const { path, visitorId, productId } = await req.json();
    
    if (!path || !visitorId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await dbConnect();
    
    const pageViewData: any = { path, visitorId };
    
    if (productId) {
      if (mongoose.isValidObjectId(productId)) {
        pageViewData.productId = productId;
      } else {
        const prod = await Product.findOne({ slug: productId }).select("_id").lean();
        if (prod?._id) {
          pageViewData.productId = prod._id;
        }
      }
    }

    await PageView.create(pageViewData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("TRACK ERROR", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
