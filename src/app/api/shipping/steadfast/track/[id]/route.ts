import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-utils';
import { trackByConsignmentId } from '@/lib/steadfast';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    const tracking = await trackByConsignmentId(params.id);
    return NextResponse.json({ success: true, data: tracking });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}