"use client";

import React from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { ProductCard } from '@/components/product/product-card';
import { clearWishlist } from '@/store/slices/wishlistSlice';
import { HeartCrack, Trash2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WishlistPage() {
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const dispatch = useDispatch();

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-12 pb-6 md:pb-10">
        <header className="border-b-2 border-border pb-4 md:pb-6 pt-2">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">My Wishlist</h1>
          <p className="text-xs md:text-base text-muted-foreground font-medium">Your curated collection of favorite pieces.</p>
        </header>

        <div className="text-center py-16 md:py-20 px-4 bg-background border-2 border-dashed border-border rounded-xl md:rounded-2xl flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full border-2 border-foreground flex items-center justify-center mb-4 md:mb-6 bg-muted">
            <HeartCrack className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
          </div>
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-foreground mb-2 md:mb-3">Your Wishlist is Empty</h3>
          <p className="text-xs md:text-sm text-muted-foreground mb-6 md:mb-8 max-w-md font-medium">Looks like you haven't saved any items yet. Browse our collection and click the heart icon to curate your favorites.</p>
          <Link href="/products" className="group relative inline-flex items-center justify-center px-8 md:px-10 h-12 md:h-14 text-[10px] md:text-xs font-black tracking-widest text-background uppercase bg-foreground rounded-lg md:rounded-xl overflow-hidden transition-all duration-500 hover:shadow-xl">
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
            <span className="relative z-10 group-hover:text-foreground transition-colors duration-500">Discover Pieces</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-12 pb-6 md:pb-10">
      
      {/* Header Section */}
      <header className="flex flex-row justify-between items-center sm:items-end gap-2 md:gap-4 border-b-2 border-border pb-4 md:pb-6 pt-2">
        <div>
          <h1 className="text-xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">My Wishlist</h1>
          <p className="text-[10px] md:text-base text-muted-foreground font-medium leading-tight">
            You have <span className="text-foreground font-black">{wishlistItems.length}</span> pieces saved.
          </p>
        </div>
        <button
          onClick={() => dispatch(clearWishlist())}
          className="group flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-3 text-[9px] md:text-xs font-black text-red-600 uppercase tracking-widest bg-red-500/10 border-2 border-red-500/20 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-lg md:rounded-xl transition-all duration-300"
        >
          <Trash2 size={14} className="md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
          Clear Wishlist
        </button>
      </header>

      {/* Grid Section */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {wishlistItems.map((item, idx) => (
          <motion.div
            key={item.productId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5) }} // Cap delay to prevent long waits
            className="h-full"
          >
            <ProductCard 
              product={{
                _id: item.productId,
                name: item.productName,
                title: item.productName,
                slug: item.productSlug,
                images: [item.productImage],
                regularPrice: item.regularPrice,
                discountPrice: item.discountPrice,
              }} 
              layout="grid-4" 
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
