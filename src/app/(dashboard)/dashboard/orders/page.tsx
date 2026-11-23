"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, CheckCircle2, Clock, Truck, XCircle, CreditCard, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import bkashIcon from '@/assets/bkash_icon.svg';
import codIcon from '@/assets/cash_on_delivery_icon.svg';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';

export default function UserOrdersPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'delivered': return { color: 'text-green-600 bg-green-500/10 border-green-600', icon: CheckCircle2, text: 'Delivered' };
      case 'cancelled': 
      case 'returned': return { color: 'text-red-600 bg-red-500/10 border-red-600', icon: XCircle, text: status.charAt(0).toUpperCase() + status.slice(1) };
      case 'shipped': 
      case 'out_for_delivery': return { color: 'text-indigo-600 bg-indigo-500/10 border-indigo-600', icon: Truck, text: status === 'out_for_delivery' ? 'Out for Delivery' : 'Shipped' };
      case 'confirmed':
      case 'processing': return { color: 'text-blue-600 bg-blue-500/10 border-blue-600', icon: Clock, text: status.charAt(0).toUpperCase() + status.slice(1) };
      default: return { color: 'text-orange-600 bg-orange-500/10 border-orange-600', icon: Package, text: 'Pending' };
    }
  };

  if (loading) return <LoadingSpinnerIphone/>

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-12 pb-6 md:pb-10">
      
      {/* Header Section */}
      <header className="border-b-2 border-border pb-4 md:pb-6 pt-2">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">My Orders</h1>
        <p className="text-xs md:text-base text-muted-foreground font-medium">Track your current deliveries and view past purchases.</p>
      </header>

      <div className="space-y-4 md:space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 px-4 bg-background border-2 border-dashed border-border rounded-2xl flex flex-col items-center">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-foreground flex items-center justify-center mb-6 bg-muted">
              <ShoppingBag className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-3">No Orders Found</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-md font-medium">Looks like you haven't made any purchases yet. Discover our latest collection and start shopping today.</p>
            <Link href="/products" className="group relative inline-flex items-center justify-center px-10 h-14 text-xs font-black tracking-widest text-background uppercase bg-foreground rounded-xl overflow-hidden transition-all duration-500 hover:shadow-xl">
              <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
              <span className="relative z-10 group-hover:text-foreground transition-colors duration-500">Shop Collection</span>
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const statusConfig = getStatusConfig(order.orderStatus);
            const StatusIcon = statusConfig.icon;

            return (
              <Link 
                href={`/dashboard/orders/${order._id}`} 
                key={order._id}
                className="block p-4 md:p-6 border-2 border-border rounded-xl md:rounded-2xl bg-background transition-all duration-300 hover:border-foreground/40 group relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                  
                  {/* Order Header Info */}
                  <div className="flex-1 space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <span className="font-black text-base md:text-lg text-foreground uppercase tracking-wider">{order.invoice || order._id.substring(0, 8).toUpperCase()}</span>
                      {order.isCustomAdminOrder && (
                        <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-blue-500/50 text-blue-500 bg-blue-500/10">
                          Custom
                        </span>
                      )}
                      <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-1 md:gap-1.5 ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} /> {statusConfig.text}
                      </span>
                    </div>
                    <div className="text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    
                    {/* Payment Summary */}
                    {(() => {
                      const isCancelled = order.orderStatus === 'cancelled' || order.orderStatus === 'returned';
                      const isFailed = order.paymentStatus === 'failed';
                      const isPaidFull = order.paymentStatus === 'paid';
                      const isDeliveryPaid = order.paymentStatus === 'delivery_paid';
                      
                      let paidAmount = 0;
                      if (isPaidFull) paidAmount = order.totalAmount;
                      else if (isDeliveryPaid) paidAmount = order.bkashAmountPaid || order.deliveryCharge || 0;
                      
                      const dueAmount = isPaidFull ? 0 : Math.max(0, order.totalAmount - paidAmount);
                      
                      return (
                        <div className="flex items-center gap-1.5 md:gap-2 mt-3 pt-3 md:mt-4 md:pt-4 border-t border-border/50">
                          {order.paymentMethod === 'bkash' ? (
                            <Image src={bkashIcon} alt="bKash" width={16} height={16} className="shrink-0 w-4 h-4 md:w-[18px] md:h-[18px]" />
                          ) : (
                            <Image src={codIcon} alt="COD" width={16} height={16} className="shrink-0 w-4 h-4 md:w-[18px] md:h-[18px]" />
                          )}
                          <span className="text-[9px] md:text-[11px] font-black uppercase tracking-wider">
                            {isCancelled ? (
                              <span className="text-red-500 line-through decoration-red-500/50">Due: {formatPrice(dueAmount)}</span>
                            ) : isFailed ? (
                              <span className="text-red-500">Payment Failed</span>
                            ) : dueAmount > 0 ? (
                              <span className="text-orange-500">Due: {formatPrice(dueAmount)}</span>
                            ) : (
                              <span className="text-green-600">Fully Paid</span>
                            )}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Items Preview */}
                  <div className="flex -space-x-2 md:-space-x-3 bg-muted p-2 md:p-3 rounded-lg md:rounded-xl border border-border/50">
                    {order.items.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="relative w-10 h-10 md:w-14 md:h-14 rounded-md md:rounded-lg border-2 border-background bg-background overflow-hidden shadow-sm">
                        <Image 
                          src={item.productImage || 'https://via.placeholder.com/80'} 
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-md md:rounded-lg border-2 border-background bg-foreground flex items-center justify-center text-[10px] md:text-xs text-background font-black shadow-sm z-10 relative">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Total & Action */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5 md:gap-2 md:w-32 md:pl-6 md:border-l-2 md:border-border mt-1 md:mt-0">
                    <div className="font-black text-lg md:text-2xl text-foreground">{formatPrice(order.totalAmount)}</div>
                    <div className="text-[9px] md:text-[10px] text-foreground font-black uppercase tracking-widest flex items-center gap-1 group-hover:text-amber-600 transition-colors bg-muted/50 px-2 py-1 md:px-3 md:py-1.5 rounded-full group-hover:bg-amber-500/10">
                      Details <ChevronRight size={12} className="md:w-3.5 md:h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
