import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Coupon } from '@/models/Coupon';
import { checkAuth } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    const { code, amount } = await req.json();
    const coupon = await Coupon.findOne({ code, isActive: true });
    
    if (!coupon) return NextResponse.json({ success: false, message: 'Invalid coupon' }, { status: 400 });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return NextResponse.json({ success: false, message: 'Expired coupon' }, { status: 400 });
    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) return NextResponse.json({ success: false, message: `Minimum amount ${coupon.minOrderAmount}` }, { status: 400 });
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return NextResponse.json({ success: false, message: 'Usage limit reached' }, { status: 400 });
    
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;

    } else {
      discount = coupon.discountValue;
    }
    
    return NextResponse.json({ success: true, data: { discount } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}