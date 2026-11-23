"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { 
  CheckCircle2, Clock, Truck, Package, MapPin, CreditCard, ChevronLeft, Tag, ChevronDown, Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import bkashIcon from '@/assets/bkash_icon.svg';
import codIcon from '@/assets/cash_on_delivery_icon.svg';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { toast } from 'sonner';

const ORDER_STATUSES = ['pending', 'in_review', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'delivery_paid'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
  in_review: 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10',
  confirmed: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
  processing: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
  shipped: 'border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10',
  out_for_delivery: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
  delivered: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  cancelled: 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10',
  returned: 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10',
  paid: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  failed: 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10',
  delivery_paid: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
  refunded: 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10',
};

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingField, setUpdatingField] = useState<'orderStatus' | 'paymentStatus' | null>(null);
  
  // Steadfast state
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [showShipmentConfirm, setShowShipmentConfirm] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      
      if (data.success) {
        setOrder(data.data);
        setAdminNote(data.data.notes || '');
        if (data.data.steadfastTrackingCode) {
          fetchTracking(data.data._id);
        }
      } else {
        setError(data.message || 'Failed to load order');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const fetchTracking = async (orderId: string) => {
    try {
      setTrackingLoading(true);
      const res = await fetch(`/api/orders/${orderId}/tracking`);
      const data = await res.json();
      if (data.success) {
        setTrackingData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tracking', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const updateStatus = async (field: 'orderStatus' | 'paymentStatus', newValue: string) => {
    try {
      setUpdatingField(field);
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${field === 'orderStatus' ? 'Order' : 'Payment'} status updated to ${newValue.replace(/_/g, ' ')}`);
        setOrder((prev: any) => ({ ...prev, [field]: newValue }));
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch {
      toast.error('Network error while updating status');
    } finally {
      setUpdatingField(null);
    }
  };

  const handleCreateShipment = async () => {
    try {
      setShipmentLoading(true);
      const res = await fetch(`/api/orders/${order._id}/ship`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Shipment created successfully via Steadfast');
        fetchOrder();
      } else {
        toast.error(data.message || 'Failed to create shipment');
      }
    } catch (error) {
      toast.error('Error connecting to Steadfast API');
    } finally {
      setShipmentLoading(false);
      setShowShipmentConfirm(false);
    }
  };

  if (loading) return <LoadingSpinnerIphone/>;

  if (error || !order) {
    return (
      <div className="p-12 text-center border border-border bg-background rounded-3xl max-w-lg mx-auto mt-10">
        <h3 className="text-xl font-bold mb-2 text-red-500">Error</h3>
        <p className="text-muted-foreground mb-6">{error || 'Order not found'}</p>
        <Link href="/admin/orders" className="group relative inline-flex items-center justify-center px-6 py-3 text-xs font-bold tracking-widest text-background uppercase bg-foreground rounded-full overflow-hidden border border-foreground transition-all duration-500 hover:shadow-xl">
          <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
          <span className="relative z-10 group-hover:text-foreground transition-colors duration-500">Back to Orders</span>
        </Link>
      </div>
    );
  }

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
    <div className="p-2 md:p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 pb-2 border-b border-border/50">
        <Link href="/admin/orders" className="p-1.5 md:p-2 rounded-lg bg-background border border-border shadow-sm hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-2xl font-bold text-foreground mb-0.5 md:mb-1 truncate">Order #{order.invoice || order._id.substring(0, 8).toUpperCase()}</h1>
          <p className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold truncate">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {order.orderStatus === 'in_review' && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-xs font-medium text-orange-700 dark:text-orange-400 leading-relaxed shadow-sm">
          <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Action Required</span>
          Customer order is currently IN REVIEW. Please call the customer at <strong>{order.shippingAddress?.phone}</strong> to confirm the order, then update the status to Confirmed or Cancelled.
        </div>
      )}

      {isPendingPayment && order.paymentMethod === 'cod' && order.subtotal >= 4000 && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-400 leading-relaxed shadow-sm">
          <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Free Delivery Qualified</span>
          Because the order subtotal is ৳4,000 or more, the advance delivery charge was automatically waived. The full amount will be collected via Cash On Delivery (COD).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Left Column: Tracking & Items */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          
          {/* Steadfast Workflow block */}
          <div className="bg-background rounded-2xl border border-border p-4 md:p-6 shadow-sm">
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 md:mb-6">Courier Tracking</h2>
            
            {order.steadfastTrackingCode ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 md:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 gap-2 sm:gap-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-0.5 md:mb-1">
                      <p className="text-xs md:text-sm font-bold">Steadfast Logistics</p>
                      {order.steadfastTrackingLink && (
                        <a href={order.steadfastTrackingLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors shadow-sm shadow-blue-500/20">
                          Track Online
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs font-mono font-semibold opacity-90 break-all">Tracking Code: {order.steadfastTrackingCode}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[9px] md:text-xs opacity-80 uppercase tracking-widest font-bold">Consignment</p>
                    <p className="text-[10px] md:text-xs font-mono font-bold break-all">{order.steadfastConsignmentId}</p>
                  </div>
                </div>

                {trackingLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                  </div>
                ) : trackingData ? (
                  <div className="space-y-4 px-2">
                    <div className="flex justify-between items-end border-b border-blue-500/20 pb-2 md:pb-3">
                      <div>
                        <p className="text-[9px] md:text-[10px] text-blue-500/70 font-semibold uppercase tracking-wider">Current Status</p>
                        <p className="text-base md:text-lg font-black text-blue-500 uppercase">{trackingData.statusLabel}</p>
                      </div>
                    </div>
                    
                    {/* Visual Timeline */}
                    <div className="relative pt-2">
                      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-blue-500/20"></div>
                      <div className="space-y-5">
                        {trackingData.steps?.map((step: any, idx: number) => (
                          <div key={idx} className={`relative flex items-center gap-4 ${step.completed || step.current ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 
                              ${step.current ? 'bg-blue-500 border-4 border-background shadow-[0_0_0_2px_rgba(59,130,246,0.3)]' : 
                                step.completed ? 'bg-blue-500' : 'bg-blue-950 border border-blue-800'}`}>
                              {step.completed && !step.current && <span className="w-2 h-2 bg-background rounded-full"></span>}
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${step.current ? 'text-blue-500' : 'text-blue-600 dark:text-blue-400'}`}>{step.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detailed History Log */}
                    {order.steadfastTrackingHistory && order.steadfastTrackingHistory.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-blue-500/20">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-500/70 mb-4">Detailed Event Log</h3>
                        <div className="space-y-4">
                          {[...order.steadfastTrackingHistory].reverse().map((event: any, idx: number) => (
                            <div key={idx} className="flex gap-3 text-sm bg-muted/10 p-3 rounded-lg border border-border/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                              <div>
                                <p className="font-semibold text-foreground text-xs leading-relaxed">{event.message}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[9px] uppercase font-bold tracking-widest text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{event.status?.replace(/_/g, ' ')}</span>
                                  <span className="text-[10px] font-medium text-muted-foreground">{new Date(event.updatedAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-blue-500/70 text-center py-4">Tracking information is currently unavailable.</p>
                )}
              </div>
            ) : (
              (order.orderStatus === 'confirmed' || order.orderStatus === 'processing') ? (
                <div className="p-4 border border-blue-500/30 bg-blue-500/5 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Steadfast Courier Integration</p>
                  </div>
                  
                  {!showShipmentConfirm ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-blue-500/20 pt-4">
                      <p className="text-sm text-blue-500/80 font-medium">Ready to ship this order? Send it directly to Steadfast Courier.</p>
                      <button 
                        onClick={() => setShowShipmentConfirm(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Create Shipment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 border-t border-blue-500/20 pt-4">
                      <p className="text-sm font-bold text-foreground">Confirm Shipment Details</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-background border border-border rounded-lg">
                          <p className="text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">Recipient</p>
                          <p className="font-bold text-foreground">{order.shippingAddress?.fullName}</p>
                          <p className="text-muted-foreground">{order.shippingAddress?.phone}</p>
                        </div>
                        <div className="p-3 bg-background border border-border rounded-lg">
                          <p className="text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">COD Amount to Collect</p>
                          <p className="font-black text-amber-500 text-base">{formatPrice(dueAmount)}</p>
                        </div>
                        <div className="col-span-2 p-3 bg-background border border-border rounded-lg">
                          <p className="text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">Delivery Address</p>
                          <p className="text-foreground text-xs leading-relaxed font-medium">
                            {[order.shippingAddress?.village, order.shippingAddress?.upazila, order.shippingAddress?.zila, order.shippingAddress?.division].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Courier Note</label>
                          <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add a note for the delivery rider..."
                            className="w-full bg-background border border-border rounded-lg p-3 text-xs outline-none focus:border-foreground/50 min-h-[60px] resize-none"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-2">
                        <Package className="text-blue-500 shrink-0 mt-0.5" size={16} />
                        <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 leading-relaxed">
                          After confirming, the detailed live warehouse tracking timeline will instantly appear here on the left!
                        </p>
                      </div>

                      <div className="flex gap-2 justify-end mt-2">
                        <button 
                          onClick={() => setShowShipmentConfirm(false)}
                          disabled={shipmentLoading}
                          className="px-4 py-2 border border-border text-foreground hover:bg-muted/20 text-xs font-bold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleCreateShipment}
                          disabled={shipmentLoading}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                          {shipmentLoading && <Loader2 className="animate-spin" size={14} />}
                          Confirm & Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border border-border/50">
                  Shipment can only be created when the order is Confirmed or Processing.
                </p>
              )
            )}
          </div>

          {/* Ordered Items */}
          <div className="bg-background rounded-2xl border border-border p-4 md:p-6 shadow-sm">
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 md:mb-6">Items Ordered ({order.items.length})</h2>
            <div className="space-y-3 md:space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-3 md:gap-4 p-2.5 md:p-4 rounded-xl border border-border/50 hover:border-foreground/20 bg-muted/10 transition-colors">
                  <div className="w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden border border-border bg-neutral-800">
                    <Image src={item.productImage || 'https://via.placeholder.com/150'} alt={item.productName} width={96} height={96} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <Link href={`/products/${item.product?.slug || item.productId}`} target="_blank" rel="noopener noreferrer" className="font-bold text-sm md:text-base text-foreground hover:underline truncate">
                      {item.productName}
                    </Link>
                    <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1 md:mt-1.5 flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1">
                      <span>Size: {item.size}</span>
                      <span className="flex items-center gap-1.5">Color: <span className="w-3 h-3 rounded-full border border-border shadow-sm" style={{backgroundColor: item.colorHex || item.color}}></span> {item.color}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 md:mt-3">
                      <span className="text-xs md:text-sm font-black text-emerald-500">{formatPrice(item.totalPrice)}</span>
                      <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-md bg-background border border-border text-muted-foreground">Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Admin Controls & Summary */}
        <div className="space-y-6">
          
          {/* Admin Controls */}
          <div className="bg-foreground/[0.03] rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-5 flex items-center gap-2">
              Order Controls
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Order Status</label>
                <div className="relative">
                  <select
                    value={order.orderStatus}
                    onChange={(e) => updateStatus('orderStatus', e.target.value)}
                    disabled={updatingField === 'orderStatus'}
                    className={`w-full appearance-none pl-4 pr-10 py-2.5 border rounded-lg outline-none cursor-pointer text-xs font-bold uppercase tracking-wider transition-colors
                      ${STATUS_BADGE[order.orderStatus] || 'bg-background border-border text-foreground hover:border-foreground/30 focus:border-foreground'}
                      ${updatingField === 'orderStatus' ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s} className="bg-background text-foreground uppercase">{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  {updatingField === 'orderStatus' ? (
                     <Loader2 className={`absolute right-3 top-1/2 -translate-y-1/2 animate-spin ${STATUS_BADGE[order.orderStatus] ? '' : 'text-muted-foreground'}`} size={16} />
                  ) : (
                     <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${STATUS_BADGE[order.orderStatus] ? '' : 'text-muted-foreground'}`} size={16} />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Payment Status</label>
                <div className="relative">
                  <select
                    value={order.paymentStatus}
                    onChange={(e) => updateStatus('paymentStatus', e.target.value)}
                    disabled={updatingField === 'paymentStatus'}
                    className={`w-full appearance-none pl-4 pr-10 py-2.5 border rounded-lg outline-none cursor-pointer text-xs font-bold uppercase tracking-wider transition-colors
                      ${STATUS_BADGE[order.paymentStatus] || 'bg-background border-border text-foreground hover:border-foreground/30 focus:border-foreground'}
                      ${updatingField === 'paymentStatus' ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {PAYMENT_STATUSES.map(s => (
                      <option key={s} value={s} className="bg-background text-foreground uppercase">{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  {updatingField === 'paymentStatus' ? (
                     <Loader2 className={`absolute right-3 top-1/2 -translate-y-1/2 animate-spin ${STATUS_BADGE[order.paymentStatus] ? '' : 'text-muted-foreground'}`} size={16} />
                  ) : (
                     <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${STATUS_BADGE[order.paymentStatus] ? '' : 'text-muted-foreground'}`} size={16} />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Financial Summary</h2>
            <div className="space-y-2.5 text-xs font-medium">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charge</span>
                <span>{formatPrice(order.deliveryCharge)}</span>
              </div>
              {(order.couponDiscount > 0 || order.discount > 0) && (
                <div className="flex justify-between text-emerald-500 items-start p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1">
                      <Tag size={12} /> Coupon
                    </span>
                    {order.couponCode && (
                      <span className="text-[9px] uppercase tracking-widest font-bold opacity-80 mt-0.5 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded w-fit">
                        CODE: {order.couponCode}
                      </span>
                    )}
                  </div>
                  <span className="font-bold">-{formatPrice(order.couponDiscount || order.discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-border/50 flex justify-between font-black text-sm text-foreground">
                <span>Total Amount</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <CreditCard size={14} /> Payment Info
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 border border-border p-3 rounded-lg bg-muted/5">
                {order.paymentMethod === 'bkash' ? (
                  <Image src={bkashIcon} alt="bKash" width={28} height={28} className="shrink-0" />
                ) : (
                  <Image src={codIcon} alt="Cash on Delivery" width={28} height={28} className="shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-foreground mb-0.5">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash Online Payment'}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    {order.paymentMethod === 'bkash' ? (order.bkashPaymentType?.replace(/_/g, ' ') || 'Unknown') : 'Pay on receive'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-center">
                  <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest font-bold mb-0.5">Paid via bKash</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-500">{formatPrice(paidAmount)}</p>
                </div>
                <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-lg text-center">
                  <p className="text-[9px] text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest font-bold mb-0.5">Due Amount (COD)</p>
                  <p className="text-sm font-black text-orange-600 dark:text-orange-500">{formatPrice(dueAmount)}</p>
                </div>
              </div>
              
              {isDeliveryPaid && dueAmount > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg text-[11px] font-medium text-cyan-700 dark:text-cyan-400 leading-relaxed">
                  Delivery charge was paid via bKash. The due amount of <span className="font-bold">{formatPrice(dueAmount)}</span> will be collected by the rider as Cash on Delivery.
                </div>
              )}
              
              {order.bkashPaymentId && (
                <div className="bg-muted/10 p-2.5 rounded-lg border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">bKash Transaction ID</p>
                  <p className="text-[11px] font-mono font-bold break-all text-foreground">
                    {order.bkashPaymentId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <MapPin size={16} /> Shipping Details
            </h2>
            <div className="text-sm text-foreground font-semibold space-y-2">
              <p className="font-black text-lg mb-3">{order.shippingAddress?.fullName}</p>
              <p className="flex items-center gap-2"><span className="text-muted-foreground font-medium w-16">Phone:</span> {order.shippingAddress?.phone}</p>
              <p className="flex items-start gap-2"><span className="text-muted-foreground font-medium w-16 mt-0.5">Address:</span> 
                <span className="flex-1 leading-relaxed">
                  {[order.shippingAddress?.village, order.shippingAddress?.union, order.shippingAddress?.upazila, order.shippingAddress?.zila, order.shippingAddress?.division].filter(Boolean).join(', ')}
                </span>
              </p>
              
              {order.notes && (
                <div className="mt-6 p-4 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl font-medium border border-amber-500/20">
                  <span className="font-bold uppercase tracking-wider block mb-1 text-[10px]">Customer Note:</span>
                  <p className="text-xs leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
