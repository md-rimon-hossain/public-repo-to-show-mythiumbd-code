import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';

export async function GET() {
  try {
    await dbConnect();
    const products = await Product.find({ isTrending: true, status: 'active' }).limit(12).populate('category');
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}