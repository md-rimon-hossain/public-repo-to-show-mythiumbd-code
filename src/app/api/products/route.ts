import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { ActivityLog } from '@/models/ActivityLog';
import { checkAdmin } from '@/lib/auth-utils';
import { productFilterSchema, createProductSchema, formatZodErrors } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const val = productFilterSchema.safeParse(query);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const { category, sizes, colors, minPrice, maxPrice, sort, search, trending, page = 1, limit = 12 } = val.data;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (sizes) filter['variants.size'] = { $in: sizes.split(',') };
    if (colors) filter['variants.colors.colorName'] = { $in: colors.split(',') };
    if (minPrice || maxPrice) {
      filter.discountPrice = {};
      if (minPrice) filter.discountPrice.$gte = Number(minPrice);
      if (maxPrice) filter.discountPrice.$lte = Number(maxPrice);
    }
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (trending) filter.isTrending = true;
    
    let sortObj: any = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };
    if (sort === 'price_low') sortObj = { discountPrice: 1 };
    if (sort === 'price_high') sortObj = { discountPrice: -1 };
    
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    
    const products = await Product.find(filter)
      .populate('category')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));
      
    return NextResponse.json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const val = createProductSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const data = val.data;
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    let totalQuantity = 0;
    const variants = data.variants?.map((v: any, vIdx: number) => {
      const colors = v.colors?.map((c: any, cIdx: number) => {
        totalQuantity += (c.stock || 0);
        return {
          ...c,
          sku: `${slug}-${c.colorName}-${v.size}-${vIdx}-${cIdx}`.toUpperCase().replace(/\s+/g, '')
        };
      }) || [];
      return { ...v, colors };
    }) || [];
    
    const totalSave = (data.regularPrice && data.discountPrice) ? (data.regularPrice - data.discountPrice) : 0;
    
    const product = await Product.create({ ...data, slug, variants, totalQuantity, totalSave });
    
    await ActivityLog.create({
      userId: authRes.dbUser?._id,
      entityType: 'product',
      entityId: product._id,
      action: 'create',
      details: `Created product ${product._id}`
    });
    
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}