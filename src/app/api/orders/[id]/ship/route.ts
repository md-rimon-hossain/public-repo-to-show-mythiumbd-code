import { NextResponse } from 'next/server';
import { createSteadfastOrder } from '@/lib/steadfast';
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

    if (order.steadfastConsignmentId) {
      return NextResponse.json({ success: false, message: 'Order has already been sent to Steadfast.' }, { status: 400 });
    }
    
    // Calculate precise due amount to collect (COD)
    const paidAmount = order.bkashAmountPaid || 0;
    const dueAmount = Math.max(0, order.totalAmount - paidAmount);

    let bodyData: any = {};
    try { bodyData = await req.json(); } catch(e) {}
    
    const customNote = bodyData.adminNote || order.notes || 'Handle with care';

    let shipment;
    try {
      shipment = await createSteadfastOrder({
        invoice: order.invoice,
        recipient_name: order.shippingAddress.fullName,
        recipient_phone: order.shippingAddress.phone,
        recipient_address: [order.shippingAddress.village, order.shippingAddress.upazila, order.shippingAddress.zila, order.shippingAddress.division].filter(Boolean).join(', '),
        cod_amount: dueAmount,
        note: customNote
      });
    } catch (apiError: any) {
      return NextResponse.json({ success: false, message: apiError.message || 'Failed to submit shipment to courier' }, { status: 502 });
    }

    // Update order with Steadfast IDs and status
    order.steadfastConsignmentId = shipment.consignment.consignment_id.toString();
    order.steadfastTrackingCode = shipment.consignment.tracking_code;
    order.steadfastTrackingLink = shipment.consignment.tracking_link;
    order.orderStatus = 'shipped';
    
    await order.save();

    await ActivityLog.create({
      userId: authRes.dbUser?._id,
      entityType: 'order',
      entityId: order._id,
      action: 'update',
      details: `Admin manually created Steadfast shipment. Consignment ID: ${order.steadfastConsignmentId}. Status updated to shipped.`
    });

    return NextResponse.json({
      success: true,
      message: 'Order successfully sent to Steadfast Courier.',
      data: order
    });

  } catch (error: any) {
    console.error("Steadfast Shipment API Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
