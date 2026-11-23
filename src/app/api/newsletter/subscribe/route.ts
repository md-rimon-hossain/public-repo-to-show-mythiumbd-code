import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Newsletter } from '@/models/Newsletter';
import { newsletterSubscribeSchema, formatZodErrors } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const val = newsletterSubscribeSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const existing = await Newsletter.findOne({ email: val.data.email });
    if (existing) return NextResponse.json({ success: false, message: 'Already subscribed' }, { status: 400 });
    
    await Newsletter.create({ email: val.data.email });
    return NextResponse.json({ success: true, message: 'Subscribed successfully' }, { status: 201 });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}