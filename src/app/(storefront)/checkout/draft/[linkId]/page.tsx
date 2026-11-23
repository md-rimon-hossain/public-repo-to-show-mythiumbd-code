"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import bkashIcon from "@/assets/bkash_icon.svg";

export default function DraftCheckoutPage({ params }: { params: { linkId: string } }) {
  const router = useRouter();
  
  // Force authentication with specific callback URL
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push(`/login?callbackUrl=/checkout/draft/${params.linkId}`);
    },
  });

  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    village: "",
    upazila: "",
    zila: ""
  });
  
  const [deliveryZone, setDeliveryZone] = useState("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // default
  
  // Settings fetch for bkash advance logic mirroring live checkout
  const [paymentOptions, setPaymentOptions] = useState({ fullBkash: true, codWithAdvance: true, fullCod: false });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);

  useEffect(() => {
    // Fetch draft details
    fetch(`/api/draft-orders/${params.linkId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.data.expired) {
            setError("This checkout link has expired.");
            return;
          }
          setDraft(data.data);
          const cDetails = data.data.prefilledCustomerDetails || {};
          setFormData({
            fullName: cDetails.fullName || session?.user?.name || "",
            phone: cDetails.phone || "",
            email: cDetails.email || session?.user?.email || "",
            village: cDetails.village || "",
            upazila: cDetails.upazila || "",
            zila: cDetails.zila || ""
          });
          if (cDetails.deliveryZone) {
            setDeliveryZone(cDetails.deliveryZone);
          }
        } else {
          setError(data.message);
        }
      })
      .catch(() => setError("Failed to load custom order"))
      .finally(() => setLoading(false));

    // Fetch site payment settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.paymentOptions) {
          const opts = data.data.paymentOptions;
          setPaymentOptions(opts);
          if (opts.codWithAdvance) setPaymentMethod("codWithAdvance");
          else if (opts.fullCod) setPaymentMethod("fullCod");
          else if (opts.fullBkash) setPaymentMethod("fullBkash");
        }
      });
  }, [params.linkId, session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-black mb-2 text-red-500">Link Invalid or Expired</h1>
        <p className="text-muted-foreground">{error || "This custom order link is no longer active."}</p>
        <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-foreground text-background font-black uppercase text-xs">
          Return to Shop
        </button>
      </div>
    );
  }

  // Calculate dynamic delivery charge if not overridden by admin
  let deliveryCharge = draft.deliveryChargeOverride;
  if (deliveryCharge === null) {
    deliveryCharge = deliveryZone === "inside_dhaka" ? 110 : deliveryZone === "outside_dhaka" ? 130 : 60;
  }
  
  const finalTotal = draft.subtotal + deliveryCharge - draft.manualDiscount;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placingOrder) return;
    
    setPlacingOrder(true);
    try {
      const res = await fetch(`/api/draft-orders/${params.linkId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: formData,
          deliveryZone,
          paymentMethod
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setHasPlacedOrder(true);
        if (data.data?.bkashURL) {
          window.location.href = data.data.bkashURL;
        } else {
          toast.success("Order placed successfully!");
          setTimeout(() => router.push("/dashboard/orders"), 2000);
        }
      } else {
        toast.error(data.message || "Failed to place order");
        setPlacingOrder(false);
      }
    } catch (error) {
      toast.error("Network error");
      setPlacingOrder(false);
    }
  };

  if (hasPlacedOrder) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider mb-4">Order Placed!</h1>
        <p className="text-muted-foreground max-w-md">Your custom order has been confirmed. You will receive an email shortly.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 pt-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider">Custom Checkout</h1>
        <p className="text-muted-foreground mt-2">Complete your specially negotiated order.</p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COL: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Shipping Address */}
          <div className="p-6 border border-border bg-background rounded-xl">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required type="text" placeholder="Full Name" className="w-full h-12 bg-transparent border border-border px-4 outline-none focus:border-foreground" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              <input required type="tel" placeholder="Mobile Number" className="w-full h-12 bg-transparent border border-border px-4 outline-none focus:border-foreground" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Select Delivery Zone</label>
                <select 
                  required 
                  className="w-full h-12 bg-transparent border border-border px-4 outline-none focus:border-foreground appearance-none disabled:opacity-70" 
                  value={deliveryZone} 
                  onChange={(e) => setDeliveryZone(e.target.value)}
                  disabled={draft.paymentStatus === 'delivery_paid' || draft.paymentStatus === 'paid'}
                >
                  <option value="inside_dhaka">Inside Dhaka {draft.paymentStatus === 'delivery_paid' ? '(Delivery Paid)' : ''}</option>
                  <option value="outside_dhaka">Outside Dhaka {draft.paymentStatus === 'delivery_paid' ? '(Delivery Paid)' : ''}</option>
                  <option value="inside_kushtia">Inside Kushtia {draft.paymentStatus === 'delivery_paid' ? '(Delivery Paid)' : ''}</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">* We need your zone to assign the correct courier, even if you already paid.</p>
              </div>

              <input required type="text" placeholder="District" className="w-full h-12 bg-transparent border border-border px-4 outline-none focus:border-foreground" value={formData.zila} onChange={(e) => setFormData({...formData, zila: e.target.value})} />
              <input required type="text" placeholder="Upazila / Thana" className="w-full h-12 bg-transparent border border-border px-4 outline-none focus:border-foreground" value={formData.upazila} onChange={(e) => setFormData({...formData, upazila: e.target.value})} />
              <input required type="text" placeholder="House / Village / Road" className="w-full h-12 bg-transparent border border-border px-4 outline-none focus:border-foreground" value={formData.village} onChange={(e) => setFormData({...formData, village: e.target.value})} />
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 border border-border bg-background rounded-xl">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Payment Method</h2>
            <div className="space-y-3">
              {draft.paymentStatus === 'paid' ? (
                <div className="p-4 border-2 border-foreground bg-foreground/5 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="font-bold text-sm">Fully Paid on WhatsApp</div>
                    <div className="text-xs text-muted-foreground mt-1">No further payment is required.</div>
                  </div>
                </div>
              ) : draft.paymentStatus === 'delivery_paid' ? (
                <div className="p-4 border-2 border-foreground bg-foreground/5 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="font-bold text-sm">Cash on Delivery (Advance Paid)</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Your delivery charge is already paid. You will only pay <b>{formatPrice(finalTotal - deliveryCharge)}</b> upon receiving the products.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {paymentOptions.fullBkash && (
                    <label className={`block border-2 p-4 cursor-pointer transition-colors ${paymentMethod === 'bkash' ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/50'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="paymentMethod" value="bkash" checked={paymentMethod === 'bkash'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-foreground" />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-bold text-sm">Pay Fully with bKash</span>
                          <Image src={bkashIcon} alt="bKash" width={60} height={25} />
                        </div>
                      </div>
                    </label>
                  )}
                  {paymentOptions.codWithAdvance && (
                    <label className={`block border-2 p-4 cursor-pointer transition-colors ${paymentMethod === 'codWithAdvance' || paymentMethod === 'cod' ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/50'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="paymentMethod" value="codWithAdvance" checked={paymentMethod === 'codWithAdvance' || paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-foreground" />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-bold text-sm">Cash on Delivery</span>
                        </div>
                      </div>
                      {(paymentMethod === 'codWithAdvance' || paymentMethod === 'cod') && draft.subtotal < 4000 && deliveryCharge > 0 && (
                        <div className="mt-3 pl-7 text-xs text-muted-foreground">
                          * You must pay the delivery charge ({formatPrice(deliveryCharge)}) via bKash in advance.
                        </div>
                      )}
                    </label>
                  )}
                  {paymentOptions.fullCod && (
                    <label className={`block border-2 p-4 cursor-pointer transition-colors ${paymentMethod === 'fullCod' ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/50'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="paymentMethod" value="fullCod" checked={paymentMethod === 'fullCod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-foreground" />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-bold text-sm">Cash on Delivery (No Advance)</span>
                        </div>
                      </div>
                    </label>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COL: Order Summary */}
        <div className="lg:col-span-5">
          <div className="p-6 border border-border bg-background rounded-xl sticky top-24">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Custom Order Summary</h2>
            
            <div className="space-y-4 divide-y divide-border mb-6">
              {draft.items.map((item: any, idx: number) => (
                <div key={idx} className="pt-4 first:pt-0 flex gap-4">
                  <div className="w-16 h-20 bg-muted relative shrink-0">
                    {item.productImage && <Image src={item.productImage} alt={item.productName} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-sm leading-tight line-clamp-1">{item.productName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.size} | {item.color} | Qty: {item.quantity}</p>
                    <p className="text-sm font-bold mt-1">{formatPrice(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(draft.subtotal)}</span>
              </div>
              {draft.manualDiscount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Custom Discount</span>
                  <span className="font-semibold">-{formatPrice(draft.manualDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge</span>
                {draft.paymentStatus === 'delivery_paid' || draft.paymentStatus === 'paid' ? (
                  <span className="font-semibold text-green-600 dark:text-green-400 line-through mr-2">
                    {deliveryCharge === 0 ? "FREE" : formatPrice(deliveryCharge)}
                  </span>
                ) : (
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {deliveryCharge === 0 ? "FREE" : formatPrice(deliveryCharge)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-border mt-4">
                <span className="font-bold uppercase tracking-wider">Total Amount to Pay</span>
                <span className="text-2xl font-black">
                  {draft.paymentStatus === 'paid' ? formatPrice(0) : draft.paymentStatus === 'delivery_paid' ? formatPrice(finalTotal - deliveryCharge) : formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={placingOrder}
              className="w-full h-14 mt-8 bg-foreground text-background font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-70 transition-opacity"
            >
              {placingOrder ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <>Place Order {draft.paymentStatus === 'paid' ? '' : draft.paymentStatus === 'delivery_paid' ? formatPrice(finalTotal - deliveryCharge) : formatPrice(finalTotal)}</>
              )}
            </button>
            <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest">
              Secure Checkout • 100% Encrypted
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
