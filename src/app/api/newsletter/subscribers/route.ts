import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Newsletter } from '@/models/Newsletter';
import { checkAdmin } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    
    const total = await Newsletter.countDocuments({ isSubscribed: true });
    const subscribers = await Newsletter.find({ isSubscribed: true })
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: subscribers,
      total,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
