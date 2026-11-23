"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { useSession } from "next-auth/react";
import { RootState } from "@/store";
import { clearCart, updateMaxStocks } from "@/store/slices/cartSlice";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import codIcon from "@/assets/cash_on_delivery_icon.svg";
import bkashIcon from "@/assets/bkash_icon.svg";
import LoadingSpinnerIphone from "@/components/shared/loadingSpinerIphone";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login?callbackUrl=/checkout");
    },
  });

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const subtotal = cartItems.reduce((total, item) => total + item.discountPrice * item.quantity, 0);
  const totalSavings = cartItems.reduce((sum, item) => {
    const savings = (item.regularPrice || item.discountPrice) - item.discountPrice;
    return sum + (savings > 0 ? savings * item.quantity : 0);
  }, 0);

  const [isValidating, setIsValidating] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
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

    if (cartItems.length > 0 && !hasFetched.current) {
      hasFetched.current = true;
      setIsValidating(true);
      fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems.map(i => ({ productId: i.productId, size: i.size, color: i.color })) })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          dispatch(updateMaxStocks(data.data));
        }
      })
      .finally(() => setIsValidating(false));
    }
  }, [cartItems, dispatch]);

  const hasInvalidItems = cartItems.some(item => item.maxStock === 0 || item.quantity > item.maxStock);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: session?.user?.email || "",
    village: "",
    upazila: "",
    zila: "",
  });
  const [deliveryZone, setDeliveryZone] = useState("inside_dhaka"); // inside_dhaka, outside_dhaka, inside_kushtia
  const [paymentMethod, setPaymentMethod] = useState(""); // codWithAdvance, fullCod, fullBkash
  const [paymentOptions, setPaymentOptions] = useState({ fullBkash: true, codWithAdvance: true, fullCod: false });
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || session?.user?.email || "",
        fullName: prev.fullName || session?.user?.name || "",
      }));
    }
  }, [session]);

  let deliveryCharge = deliveryZone === "inside_dhaka" ? 110 : deliveryZone === "outside_dhaka" ? 130 : 60;
  if (subtotal >= 4000) {
    deliveryCharge = 0;
  }
  const total = subtotal + deliveryCharge - discount;

  if (status === "loading") return <LoadingSpinnerIphone/>;
  if (cartItems.length === 0 && !hasPlacedOrder) {
    router.push("/cart");
    return null;
  }

  const handleApplyCoupon = async () => {
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon, amount: subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscount(data.data.discount);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(data.message || "Invalid coupon");
        setDiscount(0);
      }
    } catch (err) {
      toast.error("Error applying coupon");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.village || !formData.upazila || !formData.zila) {
      toast.error("Please fill in all required shipping details.");
      return;
    }

    setLoading(true);
    try {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
        colorHex: item.colorHex,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: formData,
        deliveryZone,
        couponCode: coupon || undefined,
        paymentMethod,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      
      const data = await res.json();
      if (res.ok) {
        setHasPlacedOrder(true);
        if (data?.data?.bkashURL) {
          window.location.href = data.data.bkashURL;
        } else {
          router.push(`/payment/success?invoice=${data?.data?.invoice || ''}`);
        }
      } else {
        toast.error(data.message || "Failed to place order");
        router.push("/payment/failed");
      }
    } catch (err) {
      toast.error("An error occurred");
      router.push("/payment/failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-1 md:px-4 pb-8 lg:max-w-6xl">
      <h1 className="text-xl md:text-2xl font-black mb-4 uppercase tracking-tighter">Checkout &nbsp;information</h1>
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="lg:w-2/3 flex flex-col gap-4">
          
          {/* Free Delivery Progress */}
          <div className="border border-foreground/20 p-4 md:p-5 bg-background rounded-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-3 text-foreground flex items-center gap-2">
              Delivery Status
            </h2>
            {subtotal >= 4000 ? (
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">🎉 You have unlocked FREE Delivery!</p>
            ) : (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Add <span className="text-foreground">{formatPrice(4000 - subtotal)}</span> more to unlock <span className="text-foreground">FREE Delivery</span>
              </p>
            )}
            <div className="w-full bg-foreground/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${subtotal >= 4000 ? 'bg-emerald-500' : 'bg-foreground'}`} 
                style={{ width: `${Math.min(100, (subtotal / 4000) * 100)}%` }}
              ></div>
            </div>
            {subtotal < 4000 && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#e2136e] mt-3 bg-[#e2136e]/10 p-2 rounded-sm border border-[#e2136e]/20">
                * For orders below {formatPrice(4000)}, based on your shipping zone the delivery charge ({formatPrice(deliveryCharge)}) must be paid in advance via bKash.
              </p>
            )}
          </div>

          {/* Shipping Info */}
          <div className="border border-foreground/20 p-4 md:p-5 bg-background rounded-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 pb-2 border-b border-foreground/10 text-foreground">1. Shipping Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Full Name *</label>
                <input required type="text" className="w-full border border-foreground/20 p-2 text-sm font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition-all rounded-sm" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mobile Number *</label>
                <input required type="tel" className="w-full border border-foreground/20 p-2 text-sm font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition-all rounded-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Email (Optional)</label>
                <input type="email" className="w-full border border-foreground/20 p-2 text-sm font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition-all rounded-sm" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Street Address / Village *</label>
                <input required type="text" placeholder="e.g. House 42, Road 7, Block B, or exact village location with nearest landmark for smooth delivery" className="w-full border border-foreground/20 p-2 text-sm font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition-all rounded-sm placeholder:text-muted-foreground/50 placeholder:font-medium" value={formData.village} onChange={(e) => setFormData({...formData, village: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">District/Zila *</label>
                <input required type="text" className="w-full border border-foreground/20 p-2 text-sm font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition-all rounded-sm" value={formData.zila} onChange={(e) => setFormData({...formData, zila: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Upazila/Thana *</label>
                <input required type="text" className="w-full border border-foreground/20 p-2 text-sm font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition-all rounded-sm" value={formData.upazila} onChange={(e) => setFormData({...formData, upazila: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Delivery Zone */}
          <div className="border border-foreground/20 p-4 md:p-5 bg-background rounded-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 pb-2 border-b border-foreground/10 text-foreground">2. Delivery Zone</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div onClick={() => setDeliveryZone("inside_kushtia")} className={`p-3 cursor-pointer border rounded-sm transition-all flex flex-col justify-between ${deliveryZone === "inside_kushtia" ? "border-foreground bg-foreground/5 shadow-inner" : "border-foreground/20 hover:border-foreground/50"}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-widest text-[11px]">Inside Kushtia</span>
                  {deliveryZone === "inside_kushtia" ? <CheckCircle2 size={16} className="text-foreground" /> : <Circle size={16} className="text-muted-foreground" />}
                </div>
                <span className={`text-[10px] font-bold ${deliveryZone === "inside_kushtia" ? "text-foreground" : "text-muted-foreground"}`}>{subtotal >= 4000 ? "FREE" : formatPrice(60)}</span>
              </div>
              <div onClick={() => setDeliveryZone("inside_dhaka")} className={`p-3 cursor-pointer border rounded-sm transition-all flex flex-col justify-between ${deliveryZone === "inside_dhaka" ? "border-foreground bg-foreground/5 shadow-inner" : "border-foreground/20 hover:border-foreground/50"}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-widest text-[11px]">Inside Dhaka</span>
                  {deliveryZone === "inside_dhaka" ? <CheckCircle2 size={16} className="text-foreground" /> : <Circle size={16} className="text-muted-foreground" />}
                </div>
                <span className={`text-[10px] font-bold ${deliveryZone === "inside_dhaka" ? "text-foreground" : "text-muted-foreground"}`}>{subtotal >= 4000 ? "FREE" : formatPrice(110)}</span>
              </div>
              <div onClick={() => setDeliveryZone("outside_dhaka")} className={`p-3 cursor-pointer border rounded-sm transition-all flex flex-col justify-between ${deliveryZone === "outside_dhaka" ? "border-foreground bg-foreground/5 shadow-inner" : "border-foreground/20 hover:border-foreground/50"}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-widest text-[11px]">Outside Dhaka</span>
                  {deliveryZone === "outside_dhaka" ? <CheckCircle2 size={16} className="text-foreground" /> : <Circle size={16} className="text-muted-foreground" />}
                </div>
                <span className={`text-[10px] font-bold ${deliveryZone === "outside_dhaka" ? "text-foreground" : "text-muted-foreground"}`}>{subtotal >= 4000 ? "FREE" : formatPrice(130)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border border-foreground/20 p-4 md:p-5 bg-background rounded-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 pb-2 border-b border-foreground/10 text-foreground">3. Payment Method</h2>
            <div className="flex flex-col md:flex-row gap-3">
              {paymentOptions.codWithAdvance && (
                <div onClick={() => setPaymentMethod("codWithAdvance")} className={`p-3 flex-1 cursor-pointer border rounded-sm transition-all flex items-center justify-between ${paymentMethod === "codWithAdvance" ? "border-foreground bg-foreground/5 shadow-inner" : "border-foreground/20 hover:border-foreground/50"}`}>
                  <div className="flex items-center gap-3">
                    <Image src={codIcon} alt="COD" width={32} height={32} className="w-8 h-8 rounded-sm bg-transparent" />
                    <div className="flex flex-col">
                      <span className="font-bold uppercase tracking-widest text-[11px]">Cash on Delivery</span>
                      <span className={`text-[9px] font-bold leading-tight mt-1 block ${paymentMethod === "codWithAdvance" ? "text-foreground" : "text-muted-foreground"}`}>
                        {subtotal >= 4000 
                          ? "Delivery FREE! Pay Full Amount on Arrival." 
                          : `Pay Delivery Charge (${formatPrice(deliveryCharge)}) via bKash now. Pay product price on arrival.`}
                      </span>
                    </div>
                  </div>
                  {paymentMethod === "codWithAdvance" ? <CheckCircle2 size={16} className="text-foreground" /> : <Circle size={16} className="text-muted-foreground" />}
                </div>
              )}
              
              {paymentOptions.fullCod && (
                <div onClick={() => setPaymentMethod("fullCod")} className={`p-3 flex-1 cursor-pointer border rounded-sm transition-all flex items-center justify-between ${paymentMethod === "fullCod" ? "border-foreground bg-foreground/5 shadow-inner" : "border-foreground/20 hover:border-foreground/50"}`}>
                  <div className="flex items-center gap-3">
                    <Image src={codIcon} alt="COD Full" width={32} height={32} className="w-8 h-8 rounded-sm bg-transparent" />
                    <div className="flex flex-col">
                      <span className="font-bold uppercase tracking-widest text-[11px]">Full Cash on Delivery</span>
                      <span className={`text-[9px] font-bold leading-tight mt-1 block ${paymentMethod === "fullCod" ? "text-foreground" : "text-muted-foreground"}`}>
                        Pay Full Amount on Arrival. No advance required.
                      </span>
                    </div>
                  </div>
                  {paymentMethod === "fullCod" ? <CheckCircle2 size={16} className="text-foreground" /> : <Circle size={16} className="text-muted-foreground" />}
                </div>
              )}

              {paymentOptions.fullBkash && (
                <div onClick={() => setPaymentMethod("fullBkash")} className={`p-3 flex-1 cursor-pointer border rounded-sm transition-all flex items-center justify-between ${paymentMethod === "fullBkash" ? "border-[#e2136e] bg-[#e2136e]/10 shadow-inner" : "border-foreground/20 hover:border-[#e2136e]"}`}>
                  <div className="flex items-center gap-3">
                    <Image src={bkashIcon} alt="bKash" width={40} height={40} className="w-8 h-8 rounded-sm bg-transparent" />
                    <div className="flex flex-col">
                      <span className={`font-bold uppercase tracking-widest text-[11px] ${paymentMethod === "fullBkash" ? "text-[#e2136e]" : ""}`}>Full Payment</span>
                      <span className={`text-[9px] font-bold ${paymentMethod === "fullBkash" ? "text-[#e2136e]/80" : "text-muted-foreground"}`}>Pay Full Amount via bKash</span>
                    </div>
                  </div>
                  {paymentMethod === "fullBkash" ? <CheckCircle2 size={16} className="text-[#e2136e]" /> : <Circle size={16} className="text-muted-foreground" />}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-1/3">
          <div className="border border-foreground/20 p-4 md:p-5 sticky top-28 bg-background rounded-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 pb-2 border-b border-foreground/10 text-foreground">4. Summary</h2>
            
            <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map(item => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 border-b border-foreground/10 pb-3 last:border-0 last:pb-0">
                  <Image src={item.productImage || ""} alt="" width={48} height={64} className="w-12 h-16 rounded-sm bg-neutral-800 object-cover" />
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <p className="text-[11px] font-bold uppercase tracking-tight leading-tight line-clamp-2">{item.productName}</p>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Qty: {item.quantity} · Size: {item.size}</p>
                        <p className="text-xs font-black text-red-600">{formatPrice(item.discountPrice * item.quantity)}</p>
                      </div>
                      {item.regularPrice > item.discountPrice && (
                        <p className="text-[10px] text-muted-foreground line-through">{formatPrice(item.regularPrice * item.quantity)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="mb-4 border-t border-foreground/10 pt-4">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Discount Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="ENTER COUPON" 
                  className="w-full border border-foreground/20 p-2 text-xs font-bold uppercase tracking-widest bg-transparent focus:outline-none focus:border-foreground rounded-sm transition-colors"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  disabled={discount > 0}
                />
                <button 
                  type="button" 
                  onClick={discount > 0 ? () => { setDiscount(0); setCoupon(''); } : handleApplyCoupon}
                  disabled={!coupon && discount === 0}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 rounded-sm transition-colors ${
                    discount > 0 
                      ? 'border-[#e2136e] bg-[#e2136e]/10 text-[#e2136e] hover:bg-[#e2136e]/20' 
                      : coupon 
                        ? 'border-foreground bg-foreground text-background hover:bg-background hover:text-foreground' 
                        : 'border-foreground/20 bg-foreground/5 text-foreground/40 cursor-not-allowed'
                  }`}
                >
                  {discount > 0 ? 'Remove' : 'Apply'}
                </button>
              </div>
            </div>

            <div className="border-t border-foreground/10 pt-4 space-y-2 mb-4">
              {totalSavings > 0 && (
                <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-green-600 mb-2">
                  <span className="text-muted-foreground">Total Savings</span>
                  <span>-{formatPrice(totalSavings)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-semibold uppercase tracking-widest">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-widest">
                <span className="text-muted-foreground">Delivery Charge</span>
                <span>{deliveryCharge === 0 ? "FREE" : formatPrice(deliveryCharge)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-emerald-500">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end border-t border-foreground/10 pt-4 mb-4">
              <span className="text-sm font-bold uppercase tracking-widest">Total</span>
              <span className="text-xl font-black text-foreground">{formatPrice(total)}</span>
            </div>

            <button 
              type="submit" 
              disabled={loading || isValidating || hasInvalidItems}
              className={`w-full py-3 md:py-4 font-black uppercase tracking-widest text-xs md:text-sm transition-colors rounded-sm border-2 ${
                loading || isValidating || hasInvalidItems
                ? "bg-foreground/20 text-foreground/50 border-transparent cursor-not-allowed" 
                : "bg-foreground text-background border-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              {loading ? "Processing..." : isValidating ? "Validating..." : hasInvalidItems ? "Invalid Items in Cart" : "Confirm Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

