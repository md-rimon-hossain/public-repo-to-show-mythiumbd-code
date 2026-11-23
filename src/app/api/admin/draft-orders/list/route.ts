import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DraftOrder from '@/models/DraftOrder';
import { checkAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    if (!['admin', 'superadmin'].includes(authRes.dbUser?.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    
    const draftOrders = await DraftOrder.find()
      .sort({ createdAt: -1 })
      .populate('adminCreator', 'name email');

    return NextResponse.json({
      success: true,
      data: draftOrders
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
