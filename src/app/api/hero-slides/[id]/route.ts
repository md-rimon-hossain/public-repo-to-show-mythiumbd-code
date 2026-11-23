import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { HeroSlide } from '@/models/HeroSlide';
import { checkAdmin } from '@/lib/auth-utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    const body = await req.json();
    const slide = await HeroSlide.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ success: true, data: slide });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    await HeroSlide.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}