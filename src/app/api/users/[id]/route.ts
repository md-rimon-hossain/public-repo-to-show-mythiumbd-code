import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { checkAdmin } from "@/lib/auth-utils";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    const user = await User.findById(params.id).lean();
    if (!user)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    const orderCount = await Order.countDocuments({ user: params.id });

    return NextResponse.json({ success: true, data: { ...user, orderCount } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    const body = await req.json();
    const user = await User.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
