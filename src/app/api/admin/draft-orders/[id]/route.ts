import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DraftOrder from '@/models/DraftOrder';
import { checkAuth } from '@/lib/auth-utils';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    if (!['admin', 'superadmin'].includes(authRes.dbUser?.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    
    const deletedDraft = await DraftOrder.findByIdAndDelete(params.id);
    if (!deletedDraft) {
      return NextResponse.json({ success: false, message: 'Draft order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft order deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
