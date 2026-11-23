import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { checkAdmin } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search');
    const role = url.searchParams.get('role');
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      const roles = role.split(',').map(r => r.trim());
      filter.role = { $in: roles };
    }
    
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).skip(skip).limit(limit);
    
    return NextResponse.json({ success: true, data: users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const { userId, isBlocked } = await req.json();
    const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true });
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}