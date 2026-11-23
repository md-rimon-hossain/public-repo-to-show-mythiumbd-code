"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";

export function TrendingSection({ initialProducts }: { initialProducts?: any[] } = {}) {
  const [products, setProducts] = useState<any[]>(initialProducts && initialProducts.length > 0 ? initialProducts : []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialProducts && initialProducts.length > 0) return;
    fetch("/api/products/trending")
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
          { id: "1", slug: "p1", name: "Premium Cotton Tee", description: "Soft, breathable.", regularPrice: 1500, price: 1200, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", isTrending: true },
          { id: "2", slug: "p2", name: "Urban Cargo Pants", description: "Durable and stylish.", regularPrice: 3500, price: 2800, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500", isTrending: true },
          { id: "3", slug: "p3", name: "Classic Denim Jacket", description: "Timeless fashion.", regularPrice: 4500, price: 4500, image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500", isTrending: true },
          { id: "4", slug: "p4", name: "Minimalist Watch", description: "Elegant time piece.", regularPrice: 5500, price: 4999, image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500", isTrending: true },
          { id: "5", slug: "p5", name: "Leather Sneakers", description: "Comfortable daily wear.", regularPrice: 6000, price: 5200, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500", isTrending: true },
        ]);
      });
  }, [initialProducts]);

  if (products.length === 0) return null;

  return (
    <section className="overflow-hidden">
      <div className="container mx-auto px-1 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 md:mb-4 border-b border-border pb-2 md:pb-3 gap-2 md:gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
              Trending Now
            </h2>
            <p className="text-muted-foreground mt-2 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold">Most wanted pieces</p>
          </div>
          <Link href="/products?trending=true" className="hidden md:flex group items-center gap-4 text-xs md:text-sm font-bold uppercase tracking-[0.15em] text-foreground hover:opacity-70 transition-opacity">
            <span>View Collection</span>
            <span className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </Link>
        </div>

        {/* Grid Display */}
        <div className="flex flex-col gap-6 md:gap-8 mt-6 md:mt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {products.slice(0, products.length >= 8 ? 8 : 4).map(product => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
          {products.length > (products.length >= 8 ? 8 : 4) && (
            <Link href="/products?trending=true" className="w-full flex justify-center items-center font-black uppercase tracking-widest text-[10px] md:text-xs py-4 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors md:hidden">
              VIEW ALL TRENDING
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

