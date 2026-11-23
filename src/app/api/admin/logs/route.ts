import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ActivityLog } from '@/models/ActivityLog';
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
    
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user');
    const total = await ActivityLog.countDocuments();
    
    return NextResponse.json({ success: true, data: logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}