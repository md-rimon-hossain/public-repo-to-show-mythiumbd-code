import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Category } from '@/models/Category';
import { ActivityLog } from '@/models/ActivityLog';
import { checkAdmin } from '@/lib/auth-utils';
import { CATEGORY_SIZE_MAP } from '@/types';
import { createCategorySchema, formatZodErrors } from '@/lib/validations';

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ success: true, data: categories });
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
    const val = createCategorySchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const data = val.data;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let sizes: string[] = [];
    if (data.categoryType && CATEGORY_SIZE_MAP[data.categoryType]) {
      sizes = CATEGORY_SIZE_MAP[data.categoryType];
    }
    
    const category = await Category.create({ ...data, slug, sizes });
    
    await ActivityLog.create({
      user: authRes.dbUser?._id,
      action: 'create',
      entityType: 'category',
      entityId: category._id.toString(),
      details: `Created category ${category.name}`
    });
     
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}