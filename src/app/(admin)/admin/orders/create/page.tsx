"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Plus, Trash2, Link as LinkIcon, CheckCircle, Loader2, Copy, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateCustomOrderPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  
  // Overrides
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [deliveryChargeOverride, setDeliveryChargeOverride] = useState<string>('auto'); // auto, free, custom
  const [customDeliveryCharge, setCustomDeliveryCharge] = useState<number>(0);
  const [linkValidity, setLinkValidity] = useState<number>(30); // in minutes

  // Customer Details
  const [customer, setCustomer] = useState({
    fullName: '',
    phone: '',
    email: '',
    deliveryZone: 'inside_dhaka',
    zila: '',
    upazila: '',
    village: ''
  });

  const [orderType, setOrderType] = useState<string>('full_cod');
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');

  useEffect(() => {
    if (orderType === 'full_cod') {
      setPaymentMethod('cod');
      setPaymentStatus('pending');
    } else if (orderType === 'advance_cod') {
      setPaymentMethod('cod');
      setPaymentStatus('delivery_paid');
    } else if (orderType === 'full_bkash') {
      setPaymentMethod('bkash');
      setPaymentStatus('paid');
    }
  }, [orderType]);

  const [submitting, setSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchProducts = async (query: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const addToCart = (product: any, size: string, colorVariant: any) => {
    if (colorVariant.stock < 1) {
      toast.error('Out of stock');
      return;
    }

    const existingIndex = cart.findIndex(item => item.product === product._id && item.size === size && item.color === colorVariant.colorName);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      const item = { ...newCart[existingIndex] };
      if (item.quantity + 1 > colorVariant.stock) {
        toast.error('Maximum available stock reached');
        return;
      }
      item.quantity += 1;
      item.totalPrice = item.discountPrice * item.quantity;
      newCart[existingIndex] = item;
      setCart(newCart);
      toast.success('Quantity increased in existing item');
    } else {
      setCart([
        ...cart,
        {
          product: product._id,
          productSlug: product.slug,
          productName: product.name,
          productImage: product.images[0],
          size,
          color: colorVariant.colorName,
          colorHex: colorVariant.colorHex,
          quantity: 1,
          maxStock: colorVariant.stock,
          regularPrice: product.regularPrice,
          discountPrice: product.discountPrice,
          totalPrice: product.discountPrice
        }
      ]);
      toast.success('Item added to customer order.');
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = { ...newCart[index] };
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (item.maxStock !== undefined && newQty > item.maxStock) {
      return toast.error('Maximum available stock reached');
    }
    item.quantity = newQty;
    item.totalPrice = item.discountPrice * newQty;
    newCart[index] = item;
    setCart(newCart);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleSubmit = async (createFinalOrder: boolean) => {
    if (cart.length === 0) return toast.error('Add at least one product');
    
    if (createFinalOrder) {
      if (!customer.fullName || !customer.phone || !customer.zila || !customer.upazila || !customer.village) {
        return toast.error('All customer address fields (Name, Phone, Zila, Upazila, Village) are required to create a final order.');
      }
    }

    setSubmitting(true);
    try {
      const deliveryCharge = 
        deliveryChargeOverride === 'free' ? 0 : 
        deliveryChargeOverride === 'custom' ? customDeliveryCharge : null;

      const res = await fetch('/api/admin/draft-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          manualDiscount,
          deliveryChargeOverride: deliveryCharge,
          prefilledCustomerDetails: customer,
          paymentMethod,
          paymentStatus,
          createFinalOrder,
          expiresInMinutes: linkValidity
        })
      });
      const data = await res.json();

      if (data.success) {
        if (createFinalOrder) {
          toast.success('Order created successfully!');
          setGeneratedOrderId(data.data.orderId);
          setTimeout(() => router.push(`/admin/orders/${data.data.orderId}`), 1000);
        } else {
          toast.success('Link generated!');
          setGeneratedLink(`${window.location.origin}/checkout/draft/${data.data.linkId}`);
        }
      } else {
        toast.error(data.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="mb-4 sm:mb-6 md:mb-8 border-b border-border/50 pb-3 md:pb-0 md:border-b-0 flex flex-row justify-between items-start md:items-end gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider mb-1 md:mb-0 truncate">Create Custom Order</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Draft an order for WhatsApp customers and send them a payment link.</p>
        </div>
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 border border-border bg-background text-foreground text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-muted transition-colors shrink-0">
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Back to Orders</span><span className="sm:hidden">Back</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Product Search */}
          <div className="p-3 sm:p-4 md:p-6 border border-border bg-background rounded-xl shadow-sm">
            <h2 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2"><Search className="w-4 h-4 md:w-5 md:h-5" /> Search Products</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by name..." 
                className="w-full h-10 md:h-12 bg-transparent border border-border px-3 md:px-4 outline-none focus:border-foreground transition-colors text-[11px] md:text-sm rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-3 md:right-4 top-2.5 md:top-3.5 w-4 h-4 md:w-5 md:h-5 animate-spin text-muted-foreground" />}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 md:mt-4 border border-border divide-y divide-border rounded-lg overflow-hidden max-h-80 md:max-h-96 overflow-y-auto">
                {searchResults.map((product) => (
                  <div key={product._id} className="p-3 md:p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex gap-3 md:gap-4 mb-2 md:mb-3">
                      <div className="w-10 h-14 md:w-12 md:h-16 relative bg-muted shrink-0 rounded-md overflow-hidden">
                        {product.images[0] && (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-bold text-foreground">{formatPrice(product.discountPrice)}</p>
                          {product.regularPrice > product.discountPrice && (
                            <p className="text-[10px] text-muted-foreground line-through">{formatPrice(product.regularPrice)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Variants selector (simplified for admin quick add) */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.variants.map((v: any) => 
                        v.colors.map((c: any) => (
                          <button
                            key={`${v.size}-${c.colorName}`}
                            onClick={() => addToCart(product, v.size, c)}
                            disabled={c.stock <= 0}
                            className={`text-[10px] uppercase font-bold border px-2 py-1 flex items-center gap-1 ${c.stock <= 0 ? 'opacity-50 cursor-not-allowed border-border/50 text-muted-foreground' : 'border-border hover:border-foreground'}`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.colorHex }} />
                            {v.size} - {c.colorName}
                            <span className={`ml-1 px-1 rounded ${c.stock > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                              ({c.stock})
                            </span>
                            {c.stock > 0 && <Plus className="w-3 h-3 ml-1" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Details */}
          <div className="p-3 sm:p-4 md:p-6 border border-border bg-background rounded-xl shadow-sm">
            <h2 className="text-sm md:text-lg font-bold mb-3 md:mb-4">Selected Items ({cart.length})</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No items added yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-border">
                {cart.map((item, idx) => (
                  <div key={idx} className="pt-3 md:pt-4 first:pt-0 flex justify-between items-center">
                    <div className="flex flex-col min-w-0 pr-2">
                      <Link href={`/products/${item.productSlug}`} target="_blank" className="font-semibold text-[11px] md:text-sm line-clamp-1 hover:underline">
                        {item.productName}
                      </Link>
                      <span className="text-[9px] md:text-xs text-muted-foreground">{item.size} | {item.color}</span>
                      <span className="text-[10px] md:text-xs font-bold mt-0.5 md:mt-1">{formatPrice(item.totalPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                      <div className="flex items-center border border-border rounded-md overflow-hidden">
                        <button type="button" onClick={() => updateQuantity(idx, -1)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-muted text-xs">-</button>
                        <span className="w-5 md:w-6 text-center text-[10px] md:text-xs">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(idx, 1)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-muted text-xs">+</button>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-600 p-1 bg-red-500/10 rounded-md"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Overrides */}
          <div className="p-3 sm:p-4 md:p-6 border border-border bg-background rounded-xl shadow-sm">
            <h2 className="text-sm md:text-lg font-bold mb-3 md:mb-4">Pricing & Overrides</h2>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider mb-2 block">Manual Discount (Total)</label>
                <div className="flex items-center border border-border focus-within:border-foreground px-3">
                  <span className="text-muted-foreground mr-2">৳</span>
                  <input 
                    type="number" 
                    value={manualDiscount || ''} 
                    onChange={(e) => setManualDiscount(Number(e.target.value))}
                    className="w-full h-10 bg-transparent outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold tracking-wider mb-2 block">Delivery Charge</label>
                <select 
                  className="w-full h-10 bg-transparent border border-border px-3 outline-none focus:border-foreground text-sm"
                  value={deliveryChargeOverride}
                  onChange={(e) => setDeliveryChargeOverride(e.target.value)}
                >
                  <option value="auto">Auto Calculate by Zone (110/130/60)</option>
                  <option value="free">Free Delivery (৳0)</option>
                  <option value="custom">Custom Amount</option>
                </select>
              </div>

              {deliveryChargeOverride === 'custom' && (
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider mb-2 block">Custom Charge Amount</label>
                  <div className="flex items-center border border-border focus-within:border-foreground px-3">
                    <span className="text-muted-foreground mr-2">৳</span>
                    <input 
                      type="number" 
                      value={customDeliveryCharge || ''} 
                      onChange={(e) => setCustomDeliveryCharge(Number(e.target.value))}
                      className="w-full h-10 bg-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs uppercase font-bold tracking-wider mb-2 block text-muted-foreground flex items-center justify-between">
                  <span>Link Validity</span>
                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-foreground">Draft Only</span>
                </label>
                <select 
                  className="w-full h-10 bg-transparent border border-border px-3 outline-none focus:border-foreground text-sm"
                  value={linkValidity}
                  onChange={(e) => setLinkValidity(Number(e.target.value))}
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={720}>12 Hours</option>
                  <option value={1440}>24 Hours</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider mb-2 block">Payment Method</label>
                  <select 
                    className="w-full h-10 bg-transparent border border-border px-3 outline-none focus:border-foreground text-sm"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                  >
                    <option value="full_cod">Full Cash on Delivery</option>
                    <option value="advance_cod">Cash on Delivery Advanced</option>
                    <option value="full_bkash">Full Payment via bKash</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider mb-2 block text-muted-foreground">Payment Status</label>
                  <select 
                    className="w-full h-10 bg-muted/30 border border-border px-3 outline-none text-sm text-muted-foreground cursor-not-allowed"
                    value={paymentStatus}
                    disabled
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="delivery_paid">Delivery Charge Paid</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span> <span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-red-500"><span>Discount:</span> <span>-{formatPrice(manualDiscount)}</span></div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Delivery:</span> 
                <span className={(paymentStatus === 'paid' || paymentStatus === 'delivery_paid') ? 'line-through' : ''}>
                  {(() => {
                    const dc = deliveryChargeOverride === 'free' ? 0 : deliveryChargeOverride === 'custom' ? customDeliveryCharge : (customer.deliveryZone === 'inside_dhaka' ? 110 : customer.deliveryZone === 'inside_kushtia' ? 60 : 130);
                    return dc === 0 ? 'FREE' : formatPrice(dc);
                  })()}
                </span>
              </div>
              <div className="flex justify-between font-black text-lg pt-2 border-t border-border mt-2">
                <span>Total:</span>
                <span>
                  {(() => {
                    const dc = deliveryChargeOverride === 'free' ? 0 : deliveryChargeOverride === 'custom' ? customDeliveryCharge : (customer.deliveryZone === 'inside_dhaka' ? 110 : customer.deliveryZone === 'inside_kushtia' ? 60 : 130);
                    return formatPrice(subtotal - manualDiscount + dc);
                  })()}
                </span>
              </div>
              {(paymentStatus === 'paid' || paymentStatus === 'delivery_paid') && (
                <div className="flex justify-between font-bold text-sm text-amber-600 dark:text-amber-500 pt-1">
                  <span>Customer Will Pay:</span>
                  <span>
                    {(() => {
                      if (paymentStatus === 'paid') return formatPrice(0);
                      return formatPrice(subtotal - manualDiscount);
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-3 sm:p-4 md:p-6 border border-border bg-background rounded-xl shadow-sm">
            <h2 className="text-sm md:text-lg font-bold mb-2 flex items-baseline gap-2 flex-wrap">
              Customer Details
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-1.5 py-0.5 md:px-2 md:py-1 rounded">Required for Final Order</span>
            </h2>
            <p className="text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4 leading-relaxed">
              <strong>Generating a link?</strong> You can leave these blank. <br className="hidden md:block"/>
              <strong>Creating a final order?</strong> You must fill in all fields.
            </p>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="col-span-2">
                <input type="text" placeholder="Full Name" className="w-full h-9 md:h-10 bg-transparent border border-border px-2.5 md:px-3 rounded-md outline-none text-xs md:text-sm focus:border-foreground" value={customer.fullName} onChange={(e) => setCustomer({...customer, fullName: e.target.value})} />
              </div>
              <div className="col-span-2">
                <input type="text" placeholder="Phone (e.g. 017...)" className="w-full h-9 md:h-10 bg-transparent border border-border px-2.5 md:px-3 rounded-md outline-none text-xs md:text-sm focus:border-foreground" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} />
              </div>
              <div className="col-span-2">
                <select className="w-full h-9 md:h-10 bg-background border border-border px-2.5 md:px-3 rounded-md outline-none text-xs md:text-sm focus:border-foreground" value={customer.deliveryZone} onChange={(e) => setCustomer({...customer, deliveryZone: e.target.value})}>
                  <option value="inside_dhaka">Inside Dhaka</option>
                  <option value="outside_dhaka">Outside Dhaka</option>
                  <option value="inside_kushtia">Inside Kushtia</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <input type="text" placeholder="Zila" className="w-full h-9 md:h-10 bg-transparent border border-border px-2.5 md:px-3 rounded-md outline-none text-xs md:text-sm focus:border-foreground" value={customer.zila} onChange={(e) => setCustomer({...customer, zila: e.target.value})} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <input type="text" placeholder="Upazila" className="w-full h-9 md:h-10 bg-transparent border border-border px-2.5 md:px-3 rounded-md outline-none text-xs md:text-sm focus:border-foreground" value={customer.upazila} onChange={(e) => setCustomer({...customer, upazila: e.target.value})} />
              </div>
              <div className="col-span-2">
                <input type="text" placeholder="Village/Area" className="w-full h-9 md:h-10 bg-transparent border border-border px-2.5 md:px-3 rounded-md outline-none text-xs md:text-sm focus:border-foreground" value={customer.village} onChange={(e) => setCustomer({...customer, village: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {generatedLink ? (
              <div className="p-4 border border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                <p className="font-bold flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5"/> Link Generated!</p>
                <div className="flex items-center gap-2 mt-3">
                  <input type="text" readOnly value={generatedLink} className="flex-1 bg-background border border-green-500/30 p-3 text-sm outline-none font-mono rounded-lg" onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      toast.success('Link copied to clipboard!');
                      setTimeout(() => router.push('/admin/orders?tab=drafts'), 1000);
                    }}
                    className="shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4"/> Copy & Go to Drafts
                  </button>
                </div>
              </div>
            ) : generatedOrderId ? (
              <div className="p-4 border border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                <p className="font-bold flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5"/> Order Confirmed!</p>
                <p className="text-xs mt-2 opacity-80">Order created successfully. View it in the orders tab.</p>
              </div>
            ) : (
              <>
                <button 
                  disabled={submitting} 
                  onClick={() => handleSubmit(false)}
                  className="w-full h-12 bg-foreground text-background font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <LinkIcon className="w-4 h-4"/>}
                  Generate Place Order Link
                </button>
                <button 
                  disabled={submitting} 
                  onClick={() => handleSubmit(true)}
                  className="w-full h-12 bg-transparent border-2 border-foreground text-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-muted disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                  Create Final Order Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
