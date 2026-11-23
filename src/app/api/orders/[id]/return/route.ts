import { NextResponse } from 'next/server';
import { createSteadfastReturnRequest } from '@/lib/steadfast';
import { Order } from '@/models/Order';
import { ActivityLog } from '@/models/ActivityLog';
import dbConnect from '@/lib/db';
import { checkAdmin } from '@/lib/auth-utils';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;

    await dbConnect();
    const order = await Order.findById(params.id);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (!order.steadfastConsignmentId) {
      return NextResponse.json({ success: false, message: 'Order has not been shipped via Steadfast yet.' }, { status: 400 });
    }
    
    const body = await req.json();
    const reason = body.reason || 'Customer requested return / Order cancelled';

    let returnData;
    try {
      returnData = await createSteadfastReturnRequest(order.steadfastConsignmentId, reason);
    } catch (apiError: any) {
      return NextResponse.json({ success: false, message: apiError.message || 'Failed to submit return request to courier' }, { status: 502 });
    }

    // Update the local order status to returned/cancelled if needed
    // Usually, we'd wait for the webhook, but since admin initiated this, we can optimistically set it to returned
    order.orderStatus = 'returned';
    await order.save();

    await ActivityLog.create({
      userId: authRes.dbUser?._id,
      entityType: 'order',
      entityId: order._id,
      action: 'update',
      details: `Admin initiated Steadfast courier return request. Reason: ${reason}`
    });

    return NextResponse.json({
      success: true,
      message: 'Return request successfully submitted to courier.',
      data: returnData
    });

  } catch (error: any) {
    console.error("Return API Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
