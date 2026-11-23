import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DraftOrder from '@/models/DraftOrder';
import { checkAuth } from '@/lib/auth-utils';

export async function GET(req: Request, { params }: { params: { linkId: string } }) {
  try {
    await dbConnect();

    // Find the active draft order
    const draft = await DraftOrder.findOne({ linkId: params.linkId, status: 'active' });

    if (!draft) {
      return NextResponse.json({ success: false, message: 'Draft order not found or already completed' }, { status: 404 });
    }

    // Check expiration
    if (draft.expiresAt && new Date() > draft.expiresAt) {
      return NextResponse.json({
        success: true,
        data: { expired: true }
      });
    }

    // Return the draft order details
    return NextResponse.json({ 
      success: true, 
      data: draft 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
