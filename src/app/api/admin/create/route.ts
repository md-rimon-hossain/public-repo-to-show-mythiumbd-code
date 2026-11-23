import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { checkAdmin } from '@/lib/auth-utils';
import { clientPromise } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    if (authRes.dbUser!.role !== 'superadmin') return NextResponse.json({ success: false, message: 'Superadmin only' }, { status: 403 });
    
    const { email } = await req.json();
    const client = await clientPromise;
    await client.db().collection('users').updateOne({ email }, { $set: { role: 'admin' } });
    
    return NextResponse.json({ success: true, message: 'Promoted to admin' });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}