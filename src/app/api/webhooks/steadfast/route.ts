import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { ActivityLog } from '@/models/ActivityLog';
export async function GET(req: Request) {
  // Respond to verification pings
  // Some webhooks (like Steadfast/Facebook) require echoing back a challenge token
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  console.log("Steadfast GET Verification Ping:", query);
  
  // If they send a challenge, return it as plain text or JSON
  if (query.challenge) {
    return new NextResponse(query.challenge, { status: 200 });
  }
  
  return NextResponse.json({ status: 'success', message: 'Webhook endpoint is active', ...query });
}

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.STEADFAST_API_KEY || process.env.STEADFAST_WEBHOOK_SECRET;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token !== expectedToken) {
        console.warn("Webhook Unauthorized. Expected:", expectedToken, "Got:", token);
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. Parse Payload
    let payload: any = {};
    try {
      const text = await req.text();
      if (text) payload = JSON.parse(text);
    } catch (e) {
      console.warn("Invalid or empty JSON in Steadfast Webhook", e);
    }
    console.log("Steadfast Webhook Payload:", payload);
    
    const { notification_type, consignment_id, invoice, status, tracking_message } = payload;

    if (!consignment_id && !invoice) {
      // It's likely a test ping from the dashboard. We must return 200 to let them save the URL.
      return NextResponse.json({ status: 'success', message: 'Test ping received successfully.' });
    }

    await dbConnect();

    // 3. Find Order
    const query: any = {};
    if (consignment_id) {
      query.steadfastConsignmentId = consignment_id.toString();
    } else {
      query.invoice = invoice;
    }

    const order = await Order.findOne(query);

    if (!order) {
      console.warn("Webhook received for unknown order:", query);
      // We MUST return a 200 OK status code here instead of 404.
      // If Steadfast sends a dummy test ping (e.g. consignment_id: 12345),
      // returning 404 causes their dashboard to say "Server Error" and fail to save.
      return NextResponse.json(
        { status: 'success', message: 'Webhook received but order not found' },
        { status: 200 }
      );
    }

    // 4. Handle Notification Types
    if (notification_type === 'delivery_status') {
      const oldStatus = order.steadfastStatus;
      order.steadfastStatus = status;

      const safeStatus = status ? status.toLowerCase().replace(/ /g, '_') : '';

      // Optionally map courier status to our internal orderStatus
      if (safeStatus === 'delivered' || safeStatus === 'partial_delivered' || safeStatus === 'delivered_approval_pending' || safeStatus === 'partial_delivered_approval_pending') {
        order.orderStatus = 'delivered';
        if (order.paymentMethod === 'cod') {
          order.paymentStatus = 'paid';
        }
      } else if (safeStatus === 'cancelled' || safeStatus === 'returned' || safeStatus === 'cancelled_approval_pending') {
        order.orderStatus = 'returned'; // Courier failed to deliver, returning to sender
      } else if (safeStatus === 'out_for_delivery') {
         order.orderStatus = 'out_for_delivery';
      }
      
      if (tracking_message) {
        if (!order.steadfastTrackingHistory) order.steadfastTrackingHistory = [];
        order.steadfastTrackingHistory.push({
          status: status || 'unknown',
          message: tracking_message,
          updatedAt: payload.updated_at ? new Date(payload.updated_at) : new Date()
        });
      }

      await order.save();

      // Log the activity
      if (oldStatus !== status) {
        await ActivityLog.create({
          userId: order.user, // System update on behalf of the user/order
          entityType: 'order',
          entityId: order._id,
          action: 'update',
          details: `Steadfast courier status updated to: ${status} (${tracking_message || 'No tracking message provided'})`
        });
      }
    } else if (notification_type === 'tracking_update') {
      if (tracking_message) {
        if (!order.steadfastTrackingHistory) order.steadfastTrackingHistory = [];
        order.steadfastTrackingHistory.push({
          status: 'tracking_update',
          message: tracking_message,
          updatedAt: payload.updated_at ? new Date(payload.updated_at) : new Date()
        });
        await order.save();
      }
    }

    // 5. Send Success Response per Steadfast Documentation
    return NextResponse.json({
      status: 'success',
      message: 'Webhook received successfully.'
    });

  } catch (error) {
    console.error('Steadfast Webhook Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
