import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { StoreSettings } from "@/models/StoreSettings";
import { checkAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    await dbConnect();
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({
        paymentOptions: { fullBkash: true, codWithAdvance: true, fullCod: false },
      });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    const body = await req.json();
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings(body);
    } else {
      settings.paymentOptions = body.paymentOptions || settings.paymentOptions;
    }
    await settings.save();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
