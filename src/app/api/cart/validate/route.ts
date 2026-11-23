import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const { items } = body;
    const validatedItems = [];

    // Optimize by grouping items by product ID to minimize DB queries
    const productIds = Array.from(new Set(items.map((item: any) => item.productId)));
    const products = await Product.find({ _id: { $in: productIds } });

    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      
      let maxStock = 0;
      
      if (product) {
        const sizeVariant = product.variants?.find((v: any) => v.size === item.size);
        const colorVariant = sizeVariant?.colors?.find((c: any) => c.colorName === item.color);
        
        if (colorVariant) {
          maxStock = colorVariant.stock || 0;
        }
      }

      validatedItems.push({
        productId: item.productId,
        size: item.size,
        color: item.color,
        maxStock
      });
    }

    return NextResponse.json({ success: true, data: validatedItems });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
