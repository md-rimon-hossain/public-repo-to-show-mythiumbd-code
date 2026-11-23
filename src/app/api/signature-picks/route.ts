import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { SignaturePick } from "@/models/SignaturePick";
import { checkAdmin } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "true";
    const filter = all ? {} : { isActive: true };
    const images = await SignaturePick.find(filter).sort({ order: 1 });
    return NextResponse.json({ success: true, data: images });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    const body = await req.json();
    const image = await SignaturePick.create(body);
    return NextResponse.json({ success: true, data: image }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
