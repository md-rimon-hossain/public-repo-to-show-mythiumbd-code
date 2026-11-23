import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { checkAuth } from '@/lib/auth-utils';
import { updateProfileSchema, formatZodErrors } from '@/lib/validations';
import { auth, clientPromise } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    const client = await clientPromise;
    const user = await client.db().collection('users').findOne({ email: authRes.dbUser!.email });
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const val = updateProfileSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const client = await clientPromise;
    await client.db().collection('users').updateOne({ email: authRes.dbUser!.email }, { $set: val.data });
    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}