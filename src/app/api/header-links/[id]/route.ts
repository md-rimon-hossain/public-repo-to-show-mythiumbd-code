import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { HeaderLink } from "@/models/HeaderLink";
import { checkAdmin } from "@/lib/auth-utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    const body = await req.json();

    // A link can't be its own parent
    if (body.parentId && body.parentId === params.id) {
      return NextResponse.json(
        { success: false, message: "A link cannot be its own parent" },
        { status: 400 }
      );
    }

    const payload = { ...body };
    if ("parentId" in payload) {
      payload.parentId = payload.parentId ? payload.parentId : null;
    }

    const link = await HeaderLink.findByIdAndUpdate(params.id, payload, { new: true });
    if (!link) {
      return NextResponse.json({ success: false, message: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: link._id.toString(),
        title: link.title,
        label: link.title,
        href: link.href,
        order: link.order,
        isActive: link.isActive,
        isExternal: link.isExternal,
        parentId: link.parentId ? link.parentId.toString() : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    // Cascade delete: remove any child links pointing at this one
    await HeaderLink.deleteMany({ parentId: params.id });
    const deleted = await HeaderLink.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}