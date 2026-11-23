"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { closeCart, removeFromCart, updateQuantity } from "@/store/slices/cartSlice";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function CartSidebar() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { isOpen, items, totalPrice } = useSelector((state: RootState) => state.cart);

  const totalSavings = items.reduce((sum, item) => {
    const savings = (item.regularPrice || item.discountPrice) - item.discountPrice;
    return sum + (savings > 0 ? savings * item.quantity : 0);
  }, 0);

  useEffect(() => {
    // Close sidebar on navigation to avoid leaving it open inappropriately
    dispatch(closeCart());
  }, [pathname, dispatch]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleUpdateQuantity = (item: any, newQty: number) => {
    if (newQty < 1) return;
    dispatch(
      updateQuantity({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: newQty,
      })
    );
  };

  const handleRemove = (item: any) => {
    dispatch(
      removeFromCart({
        productId: item.productId,
        size: item.size,
        color: item.color,
      })
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => dispatch(closeCart())}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} // ultra fast ease out
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background/95 backdrop-blur-md border-l border-border shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-foreground">
                Your Cart ({items.length})
              </h2>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-lg">Your cart is empty</h3>
                  <p className="text-muted-foreground text-sm">
                    Looks like you haven't added anything yet.
                  </p>
                  <button
                    onClick={() => dispatch(closeCart())}
                    className="mt-4 px-8 py-3 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded hover:opacity-80 transition-opacity"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 md:gap-4">
                    <div className="relative w-20 h-28 md:w-24 md:h-32 bg-muted rounded overflow-hidden shrink-0">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/products/${item.productSlug}`} onClick={() => dispatch(closeCart())}>
                            <h3 className="font-bold text-xs md:text-sm uppercase tracking-wider leading-tight hover:underline">
                              {item.productName}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-1.5 md:gap-2 mt-1">
                            <span className="text-[10px] md:text-xs text-muted-foreground">Size: {item.size}</span>
                            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                            <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                              Color: <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-border inline-block" style={{ backgroundColor: item.colorHex }} />
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(item)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-auto flex items-end justify-between">
                        <div className="flex items-center border border-border h-7 md:h-8 rounded overflow-hidden">
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                            className="w-7 md:w-8 h-full flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 md:w-8 text-center text-xs font-bold flex items-center justify-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="w-7 md:w-8 h-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-black text-xs md:text-sm text-red-600">{formatPrice(item.discountPrice * item.quantity)}</span>
                          {item.regularPrice > item.discountPrice && (
                            <span className="text-[9px] md:text-[10px] text-muted-foreground line-through">{formatPrice(item.regularPrice * item.quantity)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 md:p-6 border-t border-border bg-background">
                {totalSavings > 0 && (
                  <div className="flex justify-between items-center mb-1.5 md:mb-2">
                    <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs text-muted-foreground">Total Savings</span>
                    <span className="font-black text-xs md:text-sm text-green-600">-{formatPrice(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <span className="font-bold uppercase tracking-widest text-xs md:text-sm">Subtotal</span>
                  <span className="font-black text-base md:text-lg text-red-600">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex flex-col gap-2 md:gap-3">
                  <Link href="/checkout" onClick={() => dispatch(closeCart())} className="w-full">
                    <button className="w-full flex items-center justify-center h-10 md:h-12 bg-foreground text-background border-2 border-foreground font-black uppercase tracking-widest text-[10px] md:text-xs transition-all duration-300 shadow-md hover:shadow-lg group">
                      <span className="relative inline-block">
                        Checkout
                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-background transition-all duration-300 group-hover:w-full"></span>
                      </span>
                    </button>
                  </Link>
                  <Link href="/cart" onClick={() => dispatch(closeCart())} className="w-full">
                    <button className="w-full flex items-center justify-center h-10 md:h-12 bg-transparent border-2 border-foreground text-foreground font-black uppercase tracking-widest text-[10px] md:text-xs transition-all duration-300 group hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <span className="relative inline-block">
                        View Full Cart
                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-foreground transition-all duration-300 group-hover:w-full"></span>
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
