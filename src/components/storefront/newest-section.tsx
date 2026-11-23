"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";

export function NewestSection({ initialProducts }: { initialProducts?: any[] } = {}) {
  const [products, setProducts] = useState<any[]>(initialProducts && initialProducts.length > 0 ? initialProducts : []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialProducts && initialProducts.length > 0) return;
    fetch("/api/products/newest")
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
        } else if (Array.isArray(json)) {
          setProducts(json);
        }
      })
      .catch(() => {
        // Mock data
        setProducts([
          { id: "6", slug: "p6", name: "Oversized Hoodie", description: "Cozy winter wear.", regularPrice: 2500, price: 2500, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500", isTrending: false },
          { id: "7", slug: "p7", name: "Slim Fit Chinos", description: "Perfect for office.", regularPrice: 2200, price: 1800, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500", isTrending: false },
          { id: "8", slug: "p8", name: "Graphic Printed T-Shirt", description: "Unique designs.", regularPrice: 1200, price: 999, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", isTrending: false },
          { id: "9", slug: "p9", name: "Winter Beanie", description: "Warm and stylish.", regularPrice: 800, price: 650, image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500", isTrending: false },
          { id: "10", slug: "p10", name: "Running Shoes", description: "Lightweight and fast.", regularPrice: 4500, price: 3800, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500", isTrending: false },
        ]);
      });
  }, [initialProducts]);

  if (products.length === 0) return null;

  return (
    <section className="py-2 overflow-hidden bg-white/5 dark:bg-black/10">
      <div className="container mx-auto px-1 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 md:mb-4 border-b border-border pb-2 md:pb-3 gap-2 md:gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
              New Arrivals
            </h2>
            <p className="text-muted-foreground mt-2 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold">The latest additions</p>
          </div>
          <Link href="/products?sort=newest" className="hidden md:flex group items-center gap-4 text-xs md:text-sm font-bold uppercase tracking-[0.15em] text-foreground hover:opacity-70 transition-opacity">
            <span>Explore All</span>
            <span className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </Link>
        </div>

        {/* Grid Display */}
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {products.slice(0, products.length >= 8 ? 8 : 4).map(product => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
          {products.length > (products.length >= 8 ? 8 : 4) && (
            <Link href="/products?sort=newest" className="w-full flex justify-center items-center font-black uppercase tracking-widest text-[10px] md:text-xs py-4 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors md:hidden">
              EXPLORE ALL NEW ARRIVALS
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

