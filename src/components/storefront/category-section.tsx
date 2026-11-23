"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";

interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  image: string;
  sizes: string[];
}

export function CategorySection({ initialCategories }: { initialCategories?: Category[] } = {}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories && initialCategories.length > 0 ? initialCategories : []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialCategories && initialCategories.length > 0) return;
    fetch("/api/categories")
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        } else if (Array.isArray(json)) {
          setCategories(json);
        }
      })
      .catch(() => {
        setCategories([
          { id: "1", name: "Shirts", slug: "shirts", image: "https://images.unsplash.com/photo-1602810316425-04842e640def?q=80&w=800", sizes: ["S", "M", "L", "XL"] },
          { id: "2", name: "Pants", slug: "pants", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800", sizes: ["30", "32", "34", "36"] },
          { id: "3", name: "Jackets", slug: "jackets", image: "https://images.unsplash.com/photo-1551028719-01c1eb54fcd4?q=80&w=800", sizes: ["M", "L", "XL"] },
          { id: "4", name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800", sizes: ["OS"] },
        ]);
      });
  }, [initialCategories]);

  if (categories.length === 0) return null;

  return (
    <section className="py-4">
      <div className="container mx-auto px-1 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 md:mb-4 border-b border-border pb-2 md:pb-3 gap-3 md:gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
              Shop Categories
            </h2>
            <p className="text-muted-foreground mt-1 md:mt-2 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold">Curated collections</p>
          </div>
          <Link href="/products" className="group flex items-center gap-2 md:gap-4 text-[10px] md:text-sm font-bold uppercase tracking-[0.15em] text-foreground hover:opacity-70 transition-opacity">
            <span>Explore All</span>
            <span className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3  gap-1">
          {categories.map((category) => (
            <div key={category._id || category.id}>
              <Link href={`/products?category=${category._id || category.id}`}>
                <div className="group relative aspect-[3/4] overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${category.image})` }}
                  />
                  
                  
                  <div className="absolute inset-0 p-3 md:p-6 flex flex-col justify-end">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-0 md:mb-2 translate-y-0 md:translate-y-4 group-hover:translate-y-0 group-hover:scale-100 md:group-hover:scale-105 lg:group-hover:scale-125 origin-bottom-left transition-all duration-300 ease-out">
                      {category.name.toUpperCase()}
                    </h3>
                    
                    <div className="hidden md:flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                      {category.sizes.map(size => (
                        <span key={size} className="text-[10px] md:text-xs lg:text-sm font-medium bg-white/20 text-white backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-sm border border-white/30">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

