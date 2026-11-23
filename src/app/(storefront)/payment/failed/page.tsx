"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function FailedPage() {
  const router = useRouter();
  const [reason, setReason] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("reason");
    if (r) {
      setReason(decodeURIComponent(r));
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 bg-background py-8">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-6 md:p-8 max-w-md w-full text-center rounded-sm relative border-2 border-foreground bg-background shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] md:dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] mx-4 md:mx-0">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="w-16 h-16 bg-[#e2136e]/10 border-2 border-[#e2136e] rounded-sm flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-[#e2136e]" />
        </motion.div>
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-2 text-foreground">Payment Failed</h1>
        <p className="text-xs text-muted-foreground mb-4 font-medium px-2">We couldn't process your payment. Please try again or choose a different payment method.</p>
        
        {reason && (
          <div className="mb-6 p-3 bg-[#e2136e]/5 rounded-sm border-2 border-[#e2136e]/20 text-left">
            <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
            <p className="font-semibold text-xs text-[#e2136e] leading-tight">
              {reason}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/checkout" className="w-full py-3 rounded-sm font-black text-xs uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity border-2 border-foreground">
            Try Again
          </Link>
          <Link href="/support" className="w-full py-3 rounded-sm font-black text-xs uppercase tracking-widest bg-background text-foreground hover:bg-foreground/5 transition-colors border-2 border-foreground">
            Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
