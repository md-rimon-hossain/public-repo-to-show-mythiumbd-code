import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { ActivityLog } from '@/models/ActivityLog';
import { checkAdmin } from '@/lib/auth-utils';
import { updateProductSchema, formatZodErrors } from '@/lib/validations';
import mongoose from 'mongoose';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const query = mongoose.Types.ObjectId.isValid(params.id) ? { _id: params.id } : { slug: params.id };
    const product = await Product.findOne(query).populate('category');
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
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
    const val = updateProductSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const data = val.data;
    const updateData: any = { ...data };
    
    if (data.variants) {
      updateData.totalQuantity = data.variants.reduce((acc: number, v: any) => {
        return acc + v.colors.reduce((cAcc: number, c: any) => cAcc + (c.stock || 0), 0);
      }, 0);
    }
    
    if (data.regularPrice && data.discountPrice) {
      updateData.totalSave = data.regularPrice - data.discountPrice;
    }
    
    const product = await Product.findByIdAndUpdate(params.id, updateData, { new: true });
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    
    await ActivityLog.create({
      userId: authRes.dbUser?._id,
      entityType: 'product',
      entityId: product._id,
      action: 'update',
      details: `Updated product ${product._id}`
    });
    
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    
    await ActivityLog.create({
      userId: authRes.dbUser?._id,
      action: 'DELETE_PRODUCT',
      details: `Deleted product ${params.id}`
    });
    
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}