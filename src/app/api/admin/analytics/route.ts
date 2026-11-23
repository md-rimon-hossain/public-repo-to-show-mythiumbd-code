import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { PageView } from "@/models/PageView";
import { checkAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    await dbConnect();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 1. Total Visits Today (Unique Devices)
    const visitsTodayData = await PageView.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: "$visitorId" } },
      { $count: "totalCount" }
    ]);
    const visitsToday = visitsTodayData[0]?.totalCount || 0;

    // 2. Active Now (unique visitors in last 5 mins)
    const activeNowData = await PageView.aggregate([
      { $match: { createdAt: { $gte: fiveMinsAgo } } },
      { $group: { _id: "$visitorId" } },
      { $count: "activeCount" }
    ]);
    const activeNow = activeNowData[0]?.activeCount || 0;

    // 3. Top 5 Routes
    const topRoutes = await PageView.aggregate([
      { $group: { _id: "$path", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]);

    // 4. Top 5 Products
    const topProducts = await PageView.aggregate([
      { $match: { productId: { $exists: true, $ne: null } } },
      { $group: { _id: "$productId", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          views: 1,
          name: "$product.name",
          image: { $arrayElemAt: ["$product.images", 0] },
          price: "$product.price"
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        visitsToday,
        activeNow,
        topRoutes,
        topProducts
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}




