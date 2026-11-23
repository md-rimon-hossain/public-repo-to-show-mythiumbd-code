"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { clearCart } from "@/store/slices/cartSlice";

export default function SuccessPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [countdown, setCountdown] = useState(5);
  const [isVisible, setIsVisible] = useState(true);
  const [invoice, setInvoice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get("invoice");
    
    if (inv) {
      setInvoice(inv);
      // Clear the cart only when payment is actually successful
      dispatch(clearCart());
    } else {
      router.replace("/");
    }
  }, [dispatch, router]);
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/dashboard/orders");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-background">
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.8, opacity: 0 }}
            className="p-6 md:p-12 max-w-lg w-full text-center rounded-sm relative border-2 border-foreground bg-background shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] md:dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] mx-4 md:mx-0"
          >
            <button 
              onClick={handleClose}
              className="absolute top-2 right-2 md:top-4 md:right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-sm transition-colors"
            >
              <X size={20} className="md:w-6 md:h-6" />
            </button>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="w-16 h-16 md:w-24 md:h-24 bg-emerald-500/10 border-2 border-emerald-500 rounded-sm flex items-center justify-center mx-auto mb-4 md:mb-6">
              <CheckCircle className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />
            </motion.div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-widest mb-1 md:mb-2 text-foreground">Order Placed!</h1>
            {invoice && (
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                Invoice: <span className="text-foreground">{invoice}</span>
              </p>
            )}
            <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 font-medium leading-relaxed px-2">Your order has been placed successfully and is currently under review. We will contact you soon at your provided phone number to confirm your order.</p>
            
            <div className="mb-6 md:mb-8 p-3 md:p-4 bg-foreground/5 rounded-sm border-2 border-foreground/10">
              <p className="font-bold text-xs md:text-sm uppercase tracking-wider text-foreground animate-pulse">
                Redirecting in {countdown}s...
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Link href="/dashboard/orders" className="w-full py-3 md:py-4 rounded-sm text-xs md:text-sm font-black uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity border-2 border-foreground">
                My Orders
              </Link>
              <Link href="/products" className="w-full py-3 md:py-4 rounded-sm text-xs md:text-sm font-black uppercase tracking-widest bg-background text-foreground hover:bg-foreground/5 transition-colors border-2 border-foreground">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
        

  );
}
