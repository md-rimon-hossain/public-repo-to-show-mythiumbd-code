import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import DraftOrder from '@/models/DraftOrder';
import Order from '@/models/Order';
import Product from '@/models/Product';
import ActivityLog from '@/models/ActivityLog';
import { checkAuth } from '@/lib/auth-utils';
import { sendTelegramNotification } from '@/lib/telegram';
import { createBkashPayment, grantBkashToken } from '@/lib/bkash';

export async function POST(req: Request, { params }: { params: { linkId: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    // User must be logged in to checkout a draft order
    if (!authRes.dbUser) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { shippingAddress, deliveryZone, paymentMethod } = body;

    if (!shippingAddress || !deliveryZone || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Missing required checkout fields' }, { status: 400 });
    }

    const session = await mongoose.startSession();
    let orderResult: any;
    let bkashRes: any;
    let requiresBkashPayment = false;
    
    try {
      await session.withTransaction(async () => {
        const draft = await DraftOrder.findOne({ linkId: params.linkId, status: 'active' }).session(session);
        if (!draft) {
          throw new Error('Draft order not found or already completed');
        }

        if (draft.expiresAt && new Date() > draft.expiresAt) {
          throw new Error('This checkout link has expired');
        }

        let deliveryCharge = 0;
        if (draft.deliveryChargeOverride !== null) {
          deliveryCharge = draft.deliveryChargeOverride;
        } else {
          deliveryCharge = deliveryZone === 'inside_dhaka' ? 110 : deliveryZone === 'outside_dhaka' ? 130 : 60;
        }

        const finalTotalAmount = draft.subtotal + deliveryCharge - draft.manualDiscount;

        // Bkash logic
        let dbPaymentMethod = 'cod';
        let bkashPaymentType = null;
        let finalPaymentStatus = 'pending';
        let finalBkashAmountPaid = undefined;
        
        if (draft.paymentStatus === 'delivery_paid') {
          dbPaymentMethod = 'cod';
          bkashPaymentType = 'delivery_charge';
          finalPaymentStatus = 'delivery_paid';
          finalBkashAmountPaid = deliveryCharge;
          requiresBkashPayment = false; // Already paid manually
        } else if (draft.paymentStatus === 'paid') {
          dbPaymentMethod = draft.paymentMethod; // Use whatever admin selected (bkash/sslcommerz)
          bkashPaymentType = 'full_payment';
          finalPaymentStatus = 'paid';
          finalBkashAmountPaid = finalTotalAmount;
          requiresBkashPayment = false; // Already paid manually
        } else {
          // Normal logic for system payment if still pending
          if (paymentMethod === 'bkash') {
            dbPaymentMethod = 'bkash';
            bkashPaymentType = 'full_payment';
            requiresBkashPayment = true;
          } else if (paymentMethod === 'codWithAdvance' || paymentMethod === 'cod') {
            dbPaymentMethod = 'cod';
            // Check if advance payment is required for COD
            if (draft.subtotal < 4000 && deliveryCharge > 0) {
              bkashPaymentType = 'delivery_charge';
              requiresBkashPayment = true;
            }
          }
        }

        const initialOrderStatus = requiresBkashPayment ? 'pending' : 'confirmed';

        // Generate Invoice
        const lastOrder = await Order.findOne({}, {}, { sort: { createdAt: -1 } }).session(session);
        const invoice = lastOrder?.invoice 
          ? `INV-${parseInt(lastOrder.invoice.split('-')[1]) + 1}`
          : 'INV-1000';

        const orderArr = await Order.create([{
          user: authRes.dbUser?._id,
          items: draft.items,
          shippingAddress,
          deliveryZone,
          subtotal: draft.subtotal,
          deliveryCharge,
          couponCode: draft.manualDiscount > 0 ? 'CUSTOM_DISCOUNT' : undefined,
          couponDiscount: draft.manualDiscount,
          totalAmount: finalTotalAmount,
          paymentMethod: dbPaymentMethod,
          paymentStatus: finalPaymentStatus,
          orderStatus: initialOrderStatus,
          bkashPaymentType,
          bkashAmountPaid: finalBkashAmountPaid,
          invoice,
        }], { session });
        
        orderResult = orderArr[0];

        // Update product inventory
        for (const item of draft.items) {
          await Product.updateOne(
            { _id: item.product },
            { 
              $inc: { 
                "totalQuantity": -item.quantity,
                "variants.$[sizeElem].colors.$[colorElem].stock": -item.quantity
              }
            },
            {
              session,
              arrayFilters: [
                { "sizeElem.size": item.size },
                { "colorElem.colorName": item.color }
              ]
            }
          );
        }

        // Mark draft as completed
        draft.status = 'completed';
        draft.convertedOrderId = orderResult._id;
        await draft.save({ session });
        
        await ActivityLog.create([{
          userId: authRes.dbUser?._id,
          entityType: 'order',
          entityId: orderResult._id,
          action: 'create',
          details: `Created order ${orderResult._id} from Draft ${draft.linkId}`
        }], { session });

      });
    } finally {
      await session.endSession();
    }

    if (orderResult) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const message = `
🎉🚀 <b>NEW ORDER ALERT! (Draft Link Checkout)</b> 🚀🎉
━━━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${orderResult.shippingAddress?.fullName || 'N/A'}
📞 <b>Phone:</b> ${orderResult.shippingAddress?.phone || 'N/A'}
📍 <b>Zone:</b> ${orderResult.deliveryZone?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
━━━━━━━━━━━━━━━━━━━━
🛍️ <b>Items:</b> ${orderResult.items?.length || 0}
💰 <b>Amount:</b> BDT ${orderResult.totalAmount}
💳 <b>Method:</b> ${orderResult.paymentMethod?.toUpperCase() || 'UNKNOWN'}
🧾 <b>Invoice:</b> #${orderResult.invoice}
━━━━━━━━━━━━━━━━━━━━

🔥 <i>Cha-ching! Time to pack some orders!</i>
👉 <a href="${appUrl}/admin/orders/${orderResult._id}">Click here to view in Admin Panel</a>
`;
      sendTelegramNotification(message).catch(console.error);
    }

    if (orderResult && requiresBkashPayment) {
      const token = await grantBkashToken();
      const amountToPay = orderResult.bkashPaymentType === 'full_payment' ? orderResult.totalAmount : orderResult.deliveryCharge;
      
      const bRes = await createBkashPayment(token, amountToPay, orderResult.invoice, orderResult._id.toString());
      
      orderResult.bkashPaymentId = bRes.paymentID;
      await orderResult.save();
      
      return NextResponse.json({ success: true, data: { bkashURL: bRes.bkashURL } });
    }
    
    return NextResponse.json({ success: true, data: orderResult, message: 'Order completed successfully' }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
