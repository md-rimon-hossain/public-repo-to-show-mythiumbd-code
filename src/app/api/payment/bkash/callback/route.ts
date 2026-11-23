import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { verifyBkashPayment } from "@/lib/bkash";
import { sendEmail, orderConfirmationEmail } from "@/lib/mailer";

async function restoreOrderStock(order: any) {
  if (order.orderStatus === "cancelled" || order.paymentStatus === "failed") return; // Already restored or doesn't need to
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const sizeVariant = product.variants.find((v: any) => v.size === item.size);
        const colorVariant = sizeVariant?.colors?.find((c: any) => c.colorName === item.color);
        if (colorVariant) {
          colorVariant.stock += item.quantity;
          product.totalQuantity += item.quantity;
          await product.save();
        }
      }
    }
  } catch (err) {
    console.error("Failed to restore stock for order", order._id, err);
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const paymentID = url.searchParams.get("paymentID");
    const status = url.searchParams.get("status");
    const orderId = url.searchParams.get("orderId");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!paymentID || !orderId) {
      return NextResponse.redirect(
        new URL("/payment/failed?reason=Missing+payment+ID+or+order+ID", baseUrl)
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.redirect(
        new URL("/payment/failed?reason=Order+not+found", baseUrl)
      );
    }

    // If order is already paid, prevent duplicate execution which causes bKash error
    if (order.paymentStatus === "paid" || order.paymentStatus === "delivery_paid") {
      return NextResponse.redirect(
        new URL(`/payment/success?invoice=${order.invoice}`, baseUrl)
      );
    }

    if (status === "success") {
      // 2-step verification
      const verification = await verifyBkashPayment(paymentID);

      if (verification.success && verification.data) {
        // Payment verified - update order
        if (order.bkashPaymentType === 'full_payment') {
          order.paymentStatus = "paid";
          order.bkashAmountPaid = order.totalAmount;
        } else if (order.bkashPaymentType === 'delivery_charge') {
          order.paymentStatus = "delivery_paid";
          order.bkashAmountPaid = order.deliveryCharge;
        }
        order.orderStatus = "in_review";
        order.bkashPaymentId = paymentID;
        order.bkashTransactionId = verification.data.trxID;
        await order.save();


        // Send confirmation email (non-blocking)
        try {
          if (order.shippingAddress.email) {
            const emailItems = order.items.map((item: { productName: string; size: string; color: string; quantity: number; discountPrice: number }) => ({
              name: item.productName,
              size: item.size,
              color: item.color,
              qty: item.quantity,
              price: item.discountPrice * item.quantity,
            }));

            await sendEmail({
              to: order.shippingAddress.email,
              subject: `Order Confirmed - ${order.invoice} | Mythium`,
              html: orderConfirmationEmail(
                order.shippingAddress.fullName,
                order.invoice,
                emailItems,
                order.totalAmount,
                order.steadfastTrackingCode
              ),
            });
          }
        } catch (emailError) {
          console.error("Order confirmation email failed:", emailError);
        }

        return NextResponse.redirect(
          new URL(`/payment/success?invoice=${order.invoice}`, baseUrl)
        );
      } else {
        // Verification failed
        await restoreOrderStock(order);
        order.paymentStatus = "failed";
        order.orderStatus = "cancelled";
        await order.save();
        return NextResponse.redirect(
          new URL(`/payment/failed?reason=${encodeURIComponent(verification.message)}`, baseUrl)
        );
      }
    }

    // Payment was cancelled or failed on bKash side
    await restoreOrderStock(order);
    order.paymentStatus = "failed";
    order.orderStatus = "cancelled";
    await order.save();
    return NextResponse.redirect(
      new URL(`/payment/failed?reason=Payment+${status || "cancelled"}+by+user`, baseUrl)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("bKash callback error:", message);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      new URL(`/payment/failed?reason=${encodeURIComponent(message)}`, baseUrl)
    );
  }
}