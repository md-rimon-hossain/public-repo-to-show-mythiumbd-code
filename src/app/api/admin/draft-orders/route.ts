import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DraftOrder from '@/models/DraftOrder';
import Order from '@/models/Order';
import { checkAuth } from '@/lib/auth-utils';
import Product from '@/models/Product';
import ActivityLog from '@/models/ActivityLog';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    // Ensure the user is an admin
    if (!['admin', 'superadmin'].includes(authRes.dbUser?.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      items, 
      manualDiscount = 0, 
      deliveryChargeOverride = null, 
      prefilledCustomerDetails = {}, 
      paymentMethod = 'cod',
      paymentStatus = 'pending',
      createFinalOrder = false,
      userId = null,
      expiresInMinutes = 30
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one item is required' }, { status: 400 });
    }

    // Calculate subtotal and ensure product field is set safely (handles both old and new frontend state)
    const processedItems = items.map((item: any) => ({
      ...item,
      product: item.product || item.productId
    }));

    const subtotal = processedItems.reduce((acc: number, item: any) => acc + (item.totalPrice || (item.discountPrice * item.quantity)), 0);
    
    // Calculate total amount assuming delivery charge is 0 for the draft base (it will be finalized on checkout)
    // Or if deliveryChargeOverride is provided, add it.
    let totalAmount = subtotal - manualDiscount;
    if (deliveryChargeOverride !== null) {
      totalAmount += deliveryChargeOverride;
    }

    if (totalAmount < 0) {
      return NextResponse.json({ success: false, message: 'Total amount cannot be negative' }, { status: 400 });
    }

    // Generate unique link ID
    const linkId = crypto.randomBytes(6).toString('hex'); // e.g., 'a1b2c3d4e5f6'

    // Scenario A: Create a final confirmed order directly bypassing the link checkout
    if (createFinalOrder) {
      if (!userId && !prefilledCustomerDetails.fullName) {
        return NextResponse.json({ success: false, message: 'User or full customer details required to create final order' }, { status: 400 });
      }

      // Generate invoice
      const lastOrder = await Order.findOne({}, {}, { sort: { createdAt: -1 } });
      const invoice = lastOrder?.invoice 
        ? `INV-${parseInt(lastOrder.invoice.split('-')[1]) + 1}`
        : 'INV-1000';

      const calculatedDeliveryCharge = prefilledCustomerDetails.deliveryZone === 'inside_dhaka' ? 110 : prefilledCustomerDetails.deliveryZone === 'inside_kushtia' ? 60 : 130;
      const finalDeliveryCharge = deliveryChargeOverride !== null ? deliveryChargeOverride : calculatedDeliveryCharge;
      const finalTotalAmount = subtotal + finalDeliveryCharge - manualDiscount;

      // Determine bkash fields for backward compatibility with live stats/invoices if needed
      let bkashAmountPaid = undefined;
      let bkashPaymentType = undefined;

      if (paymentStatus === 'delivery_paid') {
        bkashAmountPaid = finalDeliveryCharge;
        bkashPaymentType = 'delivery_charge';
      } else if (paymentStatus === 'paid') {
        bkashAmountPaid = finalTotalAmount;
        bkashPaymentType = 'full_payment';
      }

      const orderArr = await Order.create([{
        user: userId || authRes.dbUser?._id, // fallback to admin if no user selected
        items: processedItems,
        shippingAddress: prefilledCustomerDetails,
        deliveryZone: prefilledCustomerDetails.deliveryZone || 'inside_dhaka',
        deliveryCharge: finalDeliveryCharge,
        subtotal: subtotal,
        couponCode: manualDiscount > 0 ? 'CUSTOM_DISCOUNT' : undefined,
        couponDiscount: manualDiscount,
        totalAmount: finalTotalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        orderStatus: 'confirmed', // As requested by user: admin created orders are confirmed
        bkashAmountPaid: bkashAmountPaid,
        bkashPaymentType: bkashPaymentType,
        invoice: invoice,
        isCustomAdminOrder: true,
      }]);
      
      const orderResult = orderArr[0];

      // Update product inventory
      for (const item of processedItems) {
        await Product.updateOne(
          { _id: item.product },
          { 
            $inc: { 
              "totalQuantity": -item.quantity,
              "variants.$[sizeElem].colors.$[colorElem].stock": -item.quantity
            }
          },
          {
            arrayFilters: [
              { "sizeElem.size": item.size },
              { "colorElem.colorName": item.color }
            ]
          }
        );
      }

      // Send telegram notification
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const message = `
🎉🚀 <b>NEW ORDER ALERT! (Admin Created)</b> 🚀🎉
━━━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${orderResult.shippingAddress?.fullName || 'N/A'}
📞 <b>Phone:</b> ${orderResult.shippingAddress?.phone || 'N/A'}
📍 <b>Zone:</b> ${orderResult.deliveryZone?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
━━━━━━━━━━━━━━━━━━━━
🛍️ <b>Items:</b> ${orderResult.items?.length || 0}
💰 <b>Amount:</b> BDT ${orderResult.totalAmount}
💳 <b>Method:</b> COD
🧾 <b>Invoice:</b> #${orderResult.invoice}
━━━━━━━━━━━━━━━━━━━━

👉 <a href="${appUrl}/admin/orders/${orderResult._id}">View in Admin Panel</a>`;
      
      sendTelegramNotification(message).catch(console.error);

      return NextResponse.json({ 
        success: true, 
        message: 'Order created successfully',
        data: { orderId: orderResult._id, isFinal: true }
      }, { status: 201 });
    }

    // Scenario B: Create a Draft Order
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const draft = await DraftOrder.create({
      linkId,
      items: processedItems,
      subtotal,
      manualDiscount,
      deliveryChargeOverride,
      totalAmount,
      prefilledCustomerDetails,
      paymentMethod,
      paymentStatus,
      status: 'active',
      adminCreator: authRes.dbUser?._id,
      expiresAt
    });

    return NextResponse.json({ 
      success: true, 
      data: { linkId: draft.linkId, isFinal: false, draftId: draft._id },
      message: 'Draft order link created successfully' 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
