import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Category } from '@/models/Category';
import { ActivityLog } from '@/models/ActivityLog';
import { checkAdmin } from '@/lib/auth-utils';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const category = await Category.findById(params.id);
    if (!category) return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const category = await Category.findByIdAndUpdate(params.id, body, { new: true });
    
    await ActivityLog.create({
       user: authRes.dbUser!._id,
        action: 'update',
        entityType: 'category',
        entityId: params.id,
         details: `Updated category ${params.id}` });
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    await Category.findByIdAndDelete(params.id);
    await ActivityLog.create({
       user: authRes.dbUser!._id,
        action: 'delete',
        entityType: 'category',
        entityId: params.id,
        details: `Deleted category ${params.id}` });
    
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}