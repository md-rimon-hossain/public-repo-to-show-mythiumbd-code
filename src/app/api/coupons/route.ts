import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Coupon } from '@/models/Coupon';
import { checkAdmin } from '@/lib/auth-utils';
import { createCouponSchema, formatZodErrors } from '@/lib/validations';

export async function GET() {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: coupons });
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
    const val = createCouponSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const coupon = await Coupon.create(val.data);
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}