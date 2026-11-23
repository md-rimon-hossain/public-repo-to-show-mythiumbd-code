import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { SupportMessage } from "@/models/SupportMessage";

export async function GET() {
  try {
    const session = await auth();
    if (!session || ((session.user as any).role !== "admin" && (session.user as any).role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const messages = await SupportMessage.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error("Fetch support messages error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}
