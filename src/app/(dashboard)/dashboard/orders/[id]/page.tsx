"use client";

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, Clock, Truck, Package, MapPin, CreditCard, ChevronLeft, Tag, Loader2, ExternalLink, XCircle, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { useParams } from 'next/navigation';
import bkashIcon from '@/assets/bkash_icon.svg';
import codIcon from '@/assets/cash_on_delivery_icon.svg';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';

export default function OrderDetailsPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileTracking, setShowMobileTracking] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();
        
        if (data.success) {
          setOrder(data.data);
        } else {
          setError(data.message || 'Failed to load order');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }  
    fetchOrder();
  }, [params.id]);

  if (loading) return <LoadingSpinnerIphone/>;

  if (error || !order) {
    return (
      <div className="p-12 text-center border border-foreground/20 bg-background rounded-3xl max-w-lg mx-auto mt-10">
        <h3 className="text-xl font-bold mb-2 text-red-500">Error</h3>
        <p className="text-muted-foreground mb-6">{error || 'Order not found'}</p>
        <Link href="/dashboard/orders" className="group relative inline-flex items-center justify-center px-6 py-3 text-xs font-bold tracking-widest text-background uppercase bg-foreground rounded-full overflow-hidden border border-foreground transition-all duration-500 hover:shadow-xl">
          <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
          <span className="relative z-10 group-hover:text-foreground transition-colors duration-500">Back to Orders</span>
        </Link>
      </div>
    );
  }

  // Generate dynamic timeline based on order status
  const isCancelled = order.orderStatus === 'cancelled' || order.orderStatus === 'returned';
  const statuses = ['pending', 'in_review', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
  const currentStatusIndex = statuses.indexOf(order.orderStatus);
  
  const timeline = [
    { status: 'pending', title: 'Order Placed', completed: currentStatusIndex >= 0 || isCancelled },
    { status: 'in_review', title: 'In Review', completed: currentStatusIndex >= 1 && !isCancelled },
    { status: 'confirmed', title: 'Confirmed', completed: currentStatusIndex >= 2 },
    { status: 'processing', title: 'Processing', completed: currentStatusIndex >= 3 },
    { status: 'shipped', title: 'Shipped', completed: currentStatusIndex >= 4 },
    { status: 'out_for_delivery', title: 'Out for Delivery', completed: currentStatusIndex >= 5 },
    { status: 'delivered', title: 'Delivered', completed: order.orderStatus === 'delivered' },
  ];

  const trackingComponent = (
    <div className="space-y-0">
      {/* Order Status Timeline */}
      <div id="tracking-section" className="py-4 md:py-8 bg-background border-b border-foreground/10">
        <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 md:mb-6">Tracking Status</h2>
        
        {isCancelled ? (
          <div className={`p-8 md:p-12 rounded-2xl flex flex-col items-center justify-center text-center border-2 ${
            order.orderStatus === 'returned' 
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}>
            {order.orderStatus === 'returned' ? <AlertTriangle size={64} className="mb-6 opacity-80" /> : <XCircle size={64} className="mb-6 opacity-80" />}
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-widest">
              {order.orderStatus === 'returned' ? 'Returned' : 'Cancelled'}
            </h3>
            <p className="mt-4 text-sm md:text-base font-semibold opacity-80 max-w-md">
              {order.orderStatus === 'returned' 
                ? 'This order has been returned to us.' 
                : 'This order has been cancelled and will not be delivered.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line for mobile, horizontal for desktop */}
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-foreground/10 md:left-4 md:right-4 md:top-[15px] md:bottom-auto md:w-auto md:h-0.5"></div>
            
            <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-2">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative flex md:flex-col items-center gap-4 md:gap-2 z-10 md:w-1/5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 border-4 border-background ${
                    step.completed ? 'bg-emerald-500 text-white' : 'bg-foreground/10 text-muted-foreground'
                  }`}>
                    {step.completed ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current opacity-50" />}
                  </div>
                  <div className="md:text-center">
                    <p className={`text-sm font-bold ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile-Only Full Page Tracking View */}
      <div className={`lg:hidden ${showMobileTracking ? 'block animate-in slide-in-from-right-8 duration-300' : 'hidden'} pb-10`}>
        <div className="flex items-center gap-4 pb-4 border-b border-foreground/10 mb-2">
          <button 
            onClick={() => setShowMobileTracking(false)} 
            className="p-2 rounded-lg bg-background shadow-sm hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground border border-foreground/10"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground mb-1">Track Order</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">#{order.invoice || order._id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
        {trackingComponent}
      </div>

      {/* Main Order Details View */}
      <div className={`${showMobileTracking ? 'hidden lg:block' : 'block'} space-y-4 md:space-y-6`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/dashboard/orders" className="p-1.5 md:p-2 rounded-lg shrink-0 bg-background shadow-sm hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft size={20} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-foreground mb-0.5 md:mb-1 truncate">Order #{order.invoice || order._id.substring(0, 8).toUpperCase()}</h1>
              <p className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold truncate">Placed on {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'auto' });
              setShowMobileTracking(true);
            }}
            className="lg:hidden flex items-center shrink-0 whitespace-nowrap gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-full transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <MapPin size={12} /> Track Order
          </button>
        </div>

      {order.orderStatus === 'in_review' && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-sm font-medium text-orange-600 dark:text-orange-400 leading-relaxed shadow-sm">
          <span className="font-bold uppercase tracking-wider text-[11px] block mb-1">Order Under Review</span>
          Your order is in review. We will contact you soon to confirm your details. After contacting you, the order will be finally confirmed.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Left Column: Order Items & Timeline */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          
          {/* Ordered Items */}
          <div className="py-4 md:py-8 bg-background border-b border-foreground/10">
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">Items Ordered ({order.items.length})</h2>
            <div className="space-y-3 md:space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-3 md:gap-4 p-2 md:p-3 rounded-xl hover:bg-foreground/5 transition-colors">
                  <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden border border-foreground/10 bg-neutral-800">
                    <Image src={item.productImage || 'https://via.placeholder.com/150'} alt={item.productName} width={80} height={80} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <Link href={`/products/${item.product?.slug || item.productId}`} target="_blank" rel="noopener noreferrer" className="text-sm md:text-base font-bold text-foreground hover:underline truncate">
                      {item.productName}
                    </Link>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Size: {item.size}</span>
                      <span className="flex items-center gap-1">Color: <span className="w-2.5 h-2.5 rounded-full border border-foreground/20" style={{backgroundColor: item.colorHex || item.color}}></span> {item.color}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-foreground">{formatPrice(item.totalPrice)}</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-foreground/5 text-muted-foreground">Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            {trackingComponent}
          </div>


        </div>

        {/* Right Column: Order Summary & Info */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Summary */}
          <div className="py-6 md:py-8 bg-background border-b border-foreground/10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Fee</span>
                <span>{formatPrice(order.deliveryCharge)}</span>
              </div>
              {(order.couponDiscount > 0 || order.discount > 0) && (
                <div className="flex justify-between text-emerald-500 items-start p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1.5">
                      <Tag size={14} /> Coupon Applied
                    </span>
                    {order.couponCode && (
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-1 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit">
                        CODE: {order.couponCode}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-base">-{formatPrice(order.couponDiscount || order.discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-foreground/10 flex justify-between font-black text-lg text-foreground">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {(() => {
            const isCancelled = order.orderStatus === 'cancelled' || order.orderStatus === 'returned';
            const isFailed = order.paymentStatus === 'failed';
            const isPendingPayment = order.paymentStatus === 'pending';
            const isPaidFull = order.paymentStatus === 'paid';
            const isDeliveryPaid = order.paymentStatus === 'delivery_paid';
            
            let paidAmount = 0;
            if (isPaidFull) paidAmount = order.totalAmount;
            else if (isDeliveryPaid) paidAmount = order.bkashAmountPaid || order.deliveryCharge || 0;
            
            const dueAmount = isPaidFull ? 0 : Math.max(0, order.totalAmount - paidAmount);
            
            return (
              <div className="py-6 md:py-8 bg-background border-b border-foreground/10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <CreditCard size={16} /> Payment Details
                </h2>
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    {order.paymentMethod === 'bkash' ? (
                      <Image src={bkashIcon} alt="bKash" width={32} height={32} className="shrink-0" />
                    ) : (
                      <Image src={codIcon} alt="Cash on Delivery" width={32} height={32} className="shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash Online Payment'}
                      </p>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${isCancelled || isFailed ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {isCancelled ? 'Order Cancelled' : isFailed ? 'Payment Failed' : isPaidFull ? 'Full Payment Received' : isDeliveryPaid ? 'Delivery Charge Paid in Advance' : 'Payment Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Paid Amount</p>
                      <p className="text-sm font-bold text-foreground">{formatPrice(paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Due Amount</p>
                      <p className={`text-sm font-bold ${isCancelled || isFailed ? 'text-red-500 line-through decoration-red-500/50' : dueAmount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {formatPrice(dueAmount)}
                      </p>
                    </div>
                  </div>
                  
                  {!isCancelled && !isFailed && dueAmount > 0 && (
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 leading-relaxed">
                      Please pay the due amount of <span className="font-bold">{formatPrice(dueAmount)}</span> to the delivery rider upon receiving your package.
                    </p>
                  )}
                  
                  {isCancelled && paidAmount > 0 && (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 leading-relaxed">
                      This order was cancelled. If you paid <span className="font-bold">{formatPrice(paidAmount)}</span> via bKash and require a refund, please contact our support team.
                    </p>
                  )}
                  
                  {isFailed && (
                     <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 leading-relaxed">
                       Your payment attempt failed. Our team will contact you shortly, or you can retry placing the order.
                     </p>
                  )}

                  {order.bkashPaymentId && (
                    <div className="pt-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">bKash Transaction ID</p>
                      <p className="text-xs font-mono font-semibold break-all text-foreground bg-foreground/5 p-2 rounded-md border border-foreground/10">
                        {order.bkashPaymentId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Shipping Info */}
          <div className="py-6 md:py-8 bg-background border-b border-foreground/10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <MapPin size={16} /> Shipping Details
            </h2>
            <div className="text-sm text-muted-foreground font-medium space-y-1">
              <p className="font-bold text-foreground text-base mb-2">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p className="mt-2">{order.shippingAddress?.village}, {order.shippingAddress?.union}</p>
              <p>{order.shippingAddress?.upazila}, {order.shippingAddress?.zila}</p>
              <p>{order.shippingAddress?.division}</p>
              {order.shippingAddress?.deliveryNote && (
                <div className="mt-3 p-3 bg-amber-500/10 text-amber-600 rounded-lg text-xs font-semibold border border-amber-500/20">
                  <span className="font-bold uppercase tracking-wider block mb-1">Note:</span>
                  {order.shippingAddress.deliveryNote}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
