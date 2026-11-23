import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { HeaderLink } from "@/models/HeaderLink";
import { checkAdmin } from "@/lib/auth-utils";

// GET — list all links (flat). Storefront filters/nests client-side using parentId.
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const filter = activeOnly ? { isActive: true } : {};
    const links = await HeaderLink.find(filter).sort({ order: 1 }).lean();

    const data = links.map((l: any) => ({
      _id: l._id.toString(),
      title: l.title,
      label: l.title, // alias for storefront header component
      href: l.href,
      order: l.order,
      isActive: l.isActive,
      isExternal: l.isExternal,
      parentId: l.parentId ? l.parentId.toString() : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST — create a new link (top-level or child, based on parentId in body)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    const body = await req.json();

    if (!body.title?.trim() || !body.href?.trim()) {
      return NextResponse.json(
        { success: false, message: "Title and URL are required" },
        { status: 400 }
      );
    }

    // Normalize empty-string parentId to null (comes from a <select> "None" option)
    const payload = {
      ...body,
      parentId: body.parentId ? body.parentId : null,
    };

    const link = await HeaderLink.create(payload);
    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT — batch reorder. Body: { links: [{ _id, order }, ...] }
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    const { links } = await req.json();
    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { success: false, message: "links array is required" },
        { status: 400 }
      );
    }

    await Promise.all(
      links.map((l: { _id: string; order: number }) =>
        HeaderLink.findByIdAndUpdate(l._id, { order: l.order })
      )
    );

    return NextResponse.json({ success: true, message: "Order updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}