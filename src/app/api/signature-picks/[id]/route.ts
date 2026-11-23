import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { SignaturePick } from "@/models/SignaturePick";
import { checkAdmin } from "@/lib/auth-utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const updatedImage = await SignaturePick.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    
    if (!updatedImage) {
      return NextResponse.json({ success: false, message: "Image not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: updatedImage });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const deletedImage = await SignaturePick.findByIdAndDelete(params.id);
    
    if (!deletedImage) {
      return NextResponse.json({ success: false, message: "Image not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
