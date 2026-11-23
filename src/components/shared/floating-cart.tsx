"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { openCart } from "@/store/slices/cartSlice";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

export function FloatingCart() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const constraintsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const cartCount = useSelector((state: RootState) => 
    state.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  );

  // Floating cart icon is now visible everywhere on mobile

  // Only show if there are items in the cart (optional, but usually preferred)
  // If you want it always visible, you can remove this condition.
  // We will keep it always visible for now like the screenshot, 
  // but if count is 0, the badge disappears.

  return (
    <>
      {/* Constraint area covering the screen but avoiding the top header (80px) and giving some padding */}
      <div ref={constraintsRef} className="fixed inset-0 z-0 pointer-events-none pt-[80px] pb-6 px-6 md:hidden" />
      
      <motion.div 
        drag="y"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setTimeout(() => setIsDragging(false), 150);
        }}
        className="fixed bottom-[150px] right-2 z-50 md:hidden"
        style={{ touchAction: "none" }}
      >
        <button 
          className="block relative group cursor-grab active:cursor-grabbing" 
          aria-label="View Cart"
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return;
            }
            dispatch(openCart());
          }}
        >
          <div 
            className="flex items-center justify-center rounded-full bg-[#CB8650] hover:bg-[#B57C7B] text-white shadow-xl hover:shadow-2xl transition-colors duration-300 w-14 h-14"
          >
            <ShoppingBag className="w-6 h-6" />
          </div>
          
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 min-w-[24px] px-1 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-white shadow-md pointer-events-none">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </motion.div>
    </>
  );
}
