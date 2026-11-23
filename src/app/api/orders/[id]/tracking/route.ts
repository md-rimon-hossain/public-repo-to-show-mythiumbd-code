import { NextResponse } from 'next/server';
import { trackByConsignmentId, trackByInvoice, getDeliverySteps, getDeliveryStatusLabel } from '@/lib/steadfast';
import { Order } from '@/models/Order';
import dbConnect from '@/lib/db';
import { checkAuth } from '@/lib/auth-utils';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;

    await dbConnect();
    const order = await Order.findById(params.id);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Only allow admin or the order owner to track
    if (authRes.dbUser?.role !== 'admin' && authRes.dbUser?.role !== 'superadmin' && order.user?.toString() !== authRes.dbUser?._id?.toString()) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (!order.steadfastConsignmentId && !order.invoice) {
       return NextResponse.json({ success: false, message: 'No tracking information available for this order.' }, { status: 400 });
    }

    let trackingData;
    
    try {
      if (order.steadfastConsignmentId) {
        trackingData = await trackByConsignmentId(order.steadfastConsignmentId);
      } else if (order.invoice) {
        trackingData = await trackByInvoice(order.invoice);
      }
    } catch (apiError: any) {
      return NextResponse.json({ success: false, message: apiError.message || 'Failed to connect to tracking service' }, { status: 502 });
    }

    if (!trackingData || trackingData.status !== 200) {
      return NextResponse.json({ success: false, message: 'Tracking information not found on courier service.' }, { status: 404 });
    }

    const steps = getDeliverySteps(trackingData.delivery_status);
    const statusLabel = getDeliveryStatusLabel(trackingData.delivery_status);

    // Auto-sync local order status with Steadfast's live status
    const rawLiveStatus = trackingData.delivery_status;
    const liveStatus = rawLiveStatus ? rawLiveStatus.toLowerCase().replace(/ /g, '_') : '';
    let statusUpdated = false;

    if (order.steadfastStatus !== rawLiveStatus) {
      order.steadfastStatus = rawLiveStatus;
      statusUpdated = true;

      // Map Steadfast status to our internal orderStatus
      if (liveStatus === 'delivered' || liveStatus === 'partial_delivered' || liveStatus === 'delivered_approval_pending' || liveStatus === 'partial_delivered_approval_pending') {
        order.orderStatus = 'delivered';
        if (order.paymentMethod === 'cod') {
          order.paymentStatus = 'paid';
        }
      } else if (liveStatus === 'cancelled' || liveStatus === 'returned' || liveStatus === 'cancelled_approval_pending') {
        order.orderStatus = 'returned'; 
      } else if (liveStatus === 'out_for_delivery') {
        order.orderStatus = 'out_for_delivery';
      } else if (liveStatus === 'in_transit') {
        // Only move to shipped if it was pending/processing etc, don't revert if it was somehow further along
        if (['pending', 'in_review', 'confirmed', 'processing'].includes(order.orderStatus)) {
          order.orderStatus = 'shipped';
        }
      }
    }

    if (statusUpdated) {
      await order.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...trackingData,
        steps,
        statusLabel
      }
    });

  } catch (error: any) {
    console.error("Tracking API Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
