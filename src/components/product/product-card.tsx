"use client";
import React from 'react';

import Link from "next/link";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassBadge } from "@/components/ui/glass-badge";
import { formatPrice } from "@/lib/utils";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { toast } from "sonner";
import { addToCart } from "@/store/slices/cartSlice";
import { toggleWishlist } from "@/store/slices/wishlistSlice";

export function ProductCard({ product, layout = "grid-4" }: { product: any, layout?: string }) {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const wishlist = useSelector((state: RootState) => state.wishlist?.items || []);
  const productId = product._id || product.id;
  const isWishlisted = wishlist.some((item: any) => item.productId === productId);

  const currentPrice = product.discountPrice || product.regularPrice;
  const discount = product.regularPrice > currentPrice 
    ? Math.round(((product.regularPrice - currentPrice) / product.regularPrice) * 100) 
    : 0;

  const isOutOfStock = product.totalQuantity <= 0;

  // Removed handleAddToCart so users are forced to go to details page to select variants

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(toggleWishlist({
      productId: productId,
      productName: product.name,
      productImage: product.images?.[0] || "",
      productSlug: product.slug || "",
      regularPrice: product.regularPrice,
      discountPrice: product.discountPrice || product.regularPrice,
    }));
    if (isWishlisted) {
      toast.info("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const hasSecondaryMedia = !!(product.video || product.videoUrl || product.imageAlt || product.images?.[1]);
  const videoSrc = product.video || product.videoUrl;
  const videoRef = React.useRef<HTMLVideoElement>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full flex flex-col group/card relative"
    >
      <Link 
        href={`/products/${product.slug}`} 
        onClick={() => setIsNavigating(true)}
        className="flex flex-col flex-grow"
        onMouseEnter={() => {
          if (videoRef.current) {
            videoRef.current.play().catch(e => console.log("Play interrupted"));
          }
        }}
        onMouseLeave={() => {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      >
        <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
          <Image 
            src={product.images?.[0] || product.image || ""} 
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-500 ${hasSecondaryMedia ? 'group-hover/card:opacity-0' : ''}`}
          />
          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />
          )}
          {!videoSrc && (product.imageAlt || product.images?.[1]) && (
            <Image 
              src={product.imageAlt || product.images?.[1]} 
              alt={`${product.name} alternate view`}
              fill
              className="object-cover opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />
          )}

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isOutOfStock && (
              <span className="bg-red-600 text-white text-[10px] md:text-xs font-bold uppercase px-2 py-1 tracking-wider shadow-sm">
                OUT OF STOCK
              </span>
            )}
            {!isOutOfStock && discount > 0 && (
              <span className="bg-black text-white text-[10px] md:text-xs font-bold uppercase px-2 py-1 tracking-wider shadow-sm">
                SAVE {discount}%
              </span>
            )}
            {product.isTrending && (
              <span className="bg-white text-black text-[10px] md:text-xs font-bold uppercase px-2 py-1 tracking-wider">
                TRENDING
              </span>
            )}
          </div>
          
          {/* Favorite - Top Right */}
          <button 
            onClick={handleToggleWishlist}
            className="absolute top-2 right-2 z-20 p-2 opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity"
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-black drop-shadow-md"}`} strokeWidth={isWishlisted ? 2 : 1.5} />
          </button>
        </div>

        <div className="pt-2 pb-2 flex flex-col flex-grow">
          <h3 className="font-bold text-xs md:text-sm uppercase tracking-wide leading-tight mb-1 text-foreground group-hover/card:text-amber-500 group-hover/card:underline underline-offset-4 decoration-amber-500/50 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <div className="mt-auto">
            <div className="flex items-center flex-wrap gap-x-2">
              <span className="font-black text-sm md:text-base text-red-600">
                TK {currentPrice} BDT
              </span>
              {discount > 0 && (
                <span className="text-xs md:text-sm font-semibold text-neutral-500 line-through">
                  TK {product.regularPrice} BDT
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Full width Add to Cart / Select Options button */}
      {isOutOfStock ? (
        <button 
          disabled
          className="w-full font-black uppercase tracking-widest text-[10px] md:text-xs py-3 md:py-4 transition-colors border bg-neutral-300 text-neutral-500 border-neutral-300 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-800"
        >
          STOCK OUT
        </button>
      ) : (
        <Link 
          href={`/products/${product.slug}`}
          onClick={() => setIsNavigating(true)}
          className="w-full flex justify-center items-center font-black uppercase tracking-widest text-[10px] md:text-xs py-3 md:py-4 transition-colors border bg-black dark:bg-white text-white dark:text-black border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white"
        >
          {isNavigating ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              LOADING...
            </span>
          ) : (
            "SELECT OPTIONS"
          )}
        </Link>
      )}
    </motion.div>
  );
}
