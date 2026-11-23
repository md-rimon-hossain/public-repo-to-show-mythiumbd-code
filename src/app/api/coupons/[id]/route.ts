import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Coupon } from '@/models/Coupon';
import { checkAdmin } from '@/lib/auth-utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const coupon = await Coupon.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ success: true, data: coupon });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    await Coupon.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}