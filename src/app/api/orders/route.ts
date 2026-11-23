import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Coupon } from '@/models/Coupon';
import { ActivityLog } from '@/models/ActivityLog';
import { checkAuth } from '@/lib/auth-utils';
import { createOrderSchema, formatZodErrors } from '@/lib/validations';
import { createBkashPayment, grantBkashToken } from '@/lib/bkash';
import { auth, clientPromise } from '@/lib/auth';
import { sendTelegramNotification } from '@/lib/telegram';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    
    const client = await clientPromise;
    const db = client.db();
    const dbUser = await db.collection('users').findOne({ email: session.user.email });
    
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const adminView = url.searchParams.get('adminView') === 'true';
    const skip = (page - 1) * limit;
    
    let filter: any = {};
    if (adminView && dbUser && ['admin', 'superadmin'].includes(dbUser.role)) {
      // admin fetching all orders, no user filter applied
    } else {
      filter.user = dbUser?._id;
    }
    
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAuth();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const val = createOrderSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const data = val.data;
    
    // Use MongoDB transaction to ensure stock is only decremented if order saves successfully
    const session = await mongoose.startSession();
    let orderResult: any;
    
    try {
      await session.withTransaction(async () => {
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of data.items) {
          const product = await Product.findById(item.productId).session(session);
          if (!product) throw new Error(`Product ${item.productId} not found`);
          
          const sizeVariant = product.variants.find((v: any) => v.size === item.size);
          const colorVariant = sizeVariant?.colors?.find((c: any) => c.colorName === item.color);
          if (!colorVariant || colorVariant.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
          
          subtotal += product.discountPrice * item.quantity;
          processedItems.push({
            product: product._id,
            productName: product.name,
            productImage: product.images[0] || "",
            size: item.size,
            color: item.color,
            colorHex: colorVariant.colorHex || "#000",
            quantity: item.quantity,
            regularPrice: product.regularPrice,
            discountPrice: product.discountPrice,
            totalPrice: product.discountPrice * item.quantity
          });
          
          await Product.updateOne(
            { _id: product._id },
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
        
        let deliveryCharge = 
          data.deliveryZone === 'inside_dhaka' ? 110 : 
          data.deliveryZone === 'outside_dhaka' ? 130 : 60;
        
        if (subtotal >= 4000) {
          deliveryCharge = 0;
        }
        
        let discount = 0;
        let appliedCouponCode: string | undefined = undefined;
        
        if (data.couponCode) {
          const coupon = await Coupon.findOne({ code: data.couponCode, isActive: true }).session(session);
          if (!coupon) throw new Error("Invalid or inactive coupon");
          if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error("Coupon has expired");
          if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) throw new Error(`Minimum order amount for this coupon is ৳${coupon.minOrderAmount}`);
          if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) throw new Error("Coupon usage limit reached");
          
          if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;
          } else {
            discount = coupon.discountValue;
          }
          
          // Ensure discount doesn't exceed subtotal
          if (discount > subtotal) discount = subtotal;
          
          coupon.currentUses += 1;
          await coupon.save({ session });
          appliedCouponCode = data.couponCode;
        }
        
        const totalAmount = subtotal + deliveryCharge - discount;
        const invoice = 'INV-' + Date.now();
        
        let dbPaymentMethod = "cod";
        let bkashPaymentType: "full_payment" | "delivery_charge" | null = null;
        let requiresBkashPayment = false;

        if (data.paymentMethod === "fullBkash") {
          dbPaymentMethod = "bkash";
          bkashPaymentType = "full_payment";
          requiresBkashPayment = true;
        } else if (data.paymentMethod === "codWithAdvance") {
          dbPaymentMethod = "cod";
          if (subtotal < 4000) {
            bkashPaymentType = "delivery_charge";
            requiresBkashPayment = true;
          }
        } else if (data.paymentMethod === "fullCod") {
          dbPaymentMethod = "cod";
          bkashPaymentType = null;
          requiresBkashPayment = false;
        } else {
          // Fallback for legacy bkash/cod strings if they somehow still exist
          dbPaymentMethod = data.paymentMethod;
          requiresBkashPayment = data.paymentMethod === 'bkash' || (data.paymentMethod === 'cod' && subtotal < 4000);
          bkashPaymentType = data.paymentMethod === 'bkash' ? 'full_payment' : (data.paymentMethod === 'cod' && subtotal < 4000) ? 'delivery_charge' : null;
        }

        const initialOrderStatus = requiresBkashPayment ? 'pending' : 'in_review';

        const orderArr = await Order.create([{
          user: authRes.dbUser?._id,
          items: processedItems,
          shippingAddress: data.shippingAddress,
          deliveryZone: data.deliveryZone,
          subtotal,
          deliveryCharge,
          discount,
          totalAmount,
          invoice,
          paymentMethod: dbPaymentMethod,
          orderStatus: initialOrderStatus,
          bkashPaymentType,
          couponCode: appliedCouponCode,
          couponDiscount: discount
        }], { session });
        
        orderResult = orderArr[0];
        
        await ActivityLog.create([{
          userId: authRes.dbUser?._id,
          entityType: 'order',
          entityId: orderResult._id,
          action: 'create',
          details: `Created order ${orderResult._id}`
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    if (orderResult) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const message = `
🎉🚀 <b>NEW ORDER ALERT!</b> 🚀🎉
━━━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${orderResult?.shippingAddress?.fullName || 'N/A'}
📞 <b>Phone:</b> ${orderResult?.shippingAddress?.phone || 'N/A'}
📍 <b>Zone:</b> ${orderResult?.deliveryZone?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
━━━━━━━━━━━━━━━━━━━━
🛍️ <b>Items:</b> ${orderResult?.items?.length || 0}
💰 <b>Amount:</b> BDT ${orderResult?.totalAmount}
💳 <b>Method:</b> ${orderResult?.paymentMethod?.toUpperCase() || 'UNKNOWN'}
🧾 <b>Invoice:</b> #${orderResult.invoice}
━━━━━━━━━━━━━━━━━━━━

🔥 <i>Cha-ching! Time to pack some orders!</i>
👉 <a href="${appUrl}/admin/orders/${orderResult._id}">Click here to view in Admin Panel</a>
`;
      sendTelegramNotification(message).catch(console.error);
    }

    if (orderResult && (orderResult.bkashPaymentType === 'full_payment' || orderResult.bkashPaymentType === 'delivery_charge')) {
      const token = await grantBkashToken();
      const amountToPay = orderResult.bkashPaymentType === 'full_payment' ? orderResult.totalAmount : orderResult.deliveryCharge;
      
      const bkashRes = await createBkashPayment(token, amountToPay, orderResult.invoice, orderResult._id.toString());
      
      orderResult.bkashPaymentId = bkashRes.paymentID;
      await orderResult.save();
      
      return NextResponse.json({ success: true, data: { bkashURL: bkashRes.bkashURL } });
    }
    
    return NextResponse.json({ success: true, data: orderResult, message: 'Order created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}