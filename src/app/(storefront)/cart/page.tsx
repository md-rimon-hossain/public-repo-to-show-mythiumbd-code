"use client";

import Link from "next/link";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useEffect, useState, useRef } from "react";
import { removeFromCart, updateQuantity, updateMaxStocks } from "@/store/slices/cartSlice";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function CartPage() {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const [isValidating, setIsValidating] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
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

  const subtotal = cartItems.reduce(
    (total, item) => total + item.discountPrice * item.quantity,
    0
  );
  
  const originalTotal = cartItems.reduce(
    (total, item) => total + (item.regularPrice || item.discountPrice) * item.quantity,
    0
  );

  const totalSavings = originalTotal - subtotal;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border border-foreground/20 p-8 md:p-10 flex flex-col items-center text-center max-w-sm md:max-w-md w-full bg-background rounded-3xl transition-all duration-300 hover:border-foreground/40 shadow-sm hover:shadow-md"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-foreground/20 flex items-center justify-center mb-5 text-foreground bg-background">
            <ShoppingBag className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tighter text-foreground">Cart is Empty</h2>
          <p className="text-muted-foreground font-medium mb-6 md:mb-8 text-xs md:text-sm">
            Looks like you haven't added anything to your cart yet. Discover your next favorite fit today.
          </p>
          <Link
            href="/products"
            className="group relative w-full inline-flex items-center justify-center px-6 py-3.5 md:py-4 text-xs font-bold tracking-widest text-background uppercase bg-foreground rounded-full overflow-hidden border border-foreground transition-all duration-500 hover:shadow-xl"
          >
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
            <span className="relative z-10 group-hover:text-foreground transition-colors duration-500 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:max-w-6xl">
      <h1 className="text-2xl md:text-4xl font-black mb-6 uppercase tracking-tighter">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        {/* Cart Items */}
        <div className="lg:w-2/3 flex flex-col gap-0 border-t border-black dark:border-white">
          {cartItems.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={`${item.productId}-${item.size}-${item.color}`}
              className="py-4 border-b border-neutral-300 dark:border-neutral-700 flex flex-row items-stretch gap-4"
            >
              <Link href={`/products/${item.productSlug}`} className="shrink-0">
                <Image
                  src={item.productImage || "/placeholder.png"}
                  alt={item.productName}
                  width={96}
                  height={112}
                  className="w-20 h-28 sm:w-24 sm:h-32 object-cover border border-black/10 dark:border-white/10"
                />
              </Link>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <Link href={`/products/${item.productSlug}`}>
                      <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight line-clamp-2 hover:underline">
                        {item.productName}
                      </h3>
                    </Link>
                    <button
                      onClick={() =>
                        dispatch(
                          removeFromCart({
                            productId: item.productId,
                            size: item.size,
                            color: item.color,
                          })
                        )
                      }
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Size: {item.size}
                    </span>
                    <span className="border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      Color:{" "}
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 dark:border-white/20"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      {item.color}
                    </span>
                  </div>
                  {item.maxStock === 0 && (
                    <div className="mb-2 inline-block bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                      Out of Stock
                    </div>
                  )}
                  {item.maxStock > 0 && item.quantity > item.maxStock && (
                    <div className="mb-2 text-red-600 dark:text-red-500 text-[10px] font-bold uppercase tracking-widest">
                      Only {item.maxStock} left in stock
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end w-full mt-auto">
                  <div className="flex items-center border border-black dark:border-white h-8">
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            productId: item.productId,
                            size: item.size,
                            color: item.color,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        )
                      }
                      className="w-8 h-full flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-xs font-bold border-x border-black dark:border-white h-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            productId: item.productId,
                            size: item.size,
                            color: item.color,
                            quantity: Math.min(item.maxStock, item.quantity + 1),
                          })
                        )
                      }
                      className="w-8 h-full flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {item.regularPrice !== item.discountPrice && (
                      <span className="text-[10px] font-bold text-muted-foreground line-through decoration-red-500">
                        {formatPrice(item.regularPrice * item.quantity)}
                      </span>
                    )}
                    <span className="font-black text-sm sm:text-base">
                      {formatPrice(item.discountPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-1/3">
          <div className="border-2 border-black dark:border-white p-6 sticky top-28 bg-neutral-50 dark:bg-neutral-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6 border-b-2 border-black dark:border-white pb-4">Order Summary</h3>
            <div className="space-y-3 mb-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span className="text-foreground text-base">{formatPrice(subtotal)}</span>
              </div>
              
              {totalSavings > 0 && (
                <div className="flex justify-between items-center text-red-600 dark:text-red-500">
                  <span>Discount</span>
                  <span>- {formatPrice(totalSavings)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span>Delivery</span>
                <span className="text-right text-[10px] max-w-[150px]">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t-2 border-black dark:border-white pt-4 mb-8">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-black">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {totalSavings > 0 && (
                  <div className="text-right">
                    <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                      You Saved {formatPrice(totalSavings)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {hasInvalidItems && (
              <p className="text-red-600 dark:text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 mb-4 text-center border border-red-600 p-2">
                Some items are out of stock. Please remove or adjust them.
              </p>
            )}
            <Link
              href={hasInvalidItems ? "#" : "/checkout"}
              className={`w-full py-4 text-sm font-black uppercase tracking-widest transition-colors flex justify-center border-2 ${
                hasInvalidItems || isValidating
                  ? "bg-neutral-300 text-neutral-500 border-transparent cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500"
                  : "bg-foreground text-background border-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              {isValidating ? "Validating..." : "Proceed to Checkout"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

