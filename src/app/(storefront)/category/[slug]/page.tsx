"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FilterSidebar } from "@/components/product/filter-sidebar";
import { ProductCard } from "@/components/product/product-card";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { IProduct } from "@/types";
import { motion } from "framer-motion";

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState("grid-4");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const categoryName = (params.slug as string)?.replace("-", " ");

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const query = searchParams.toString();
        const res = await fetch(`/api/products?category=${params.slug}${query ? `&${query}` : ""}`);
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [params.slug, searchParams]);

  return (
    <div className="container mx-auto px-1 md:px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 capitalize">{categoryName} Collection</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:hidden mb-4">
          <button onClick={() => setShowMobileFilters(true)} className="glass-button w-full flex items-center justify-center gap-2 py-3">
            <SlidersHorizontal size={20} /> Show Filters
          </button>
        </div>

        <div className={`fixed inset-y-0 left-0 z-50 w-[280px] transform ${showMobileFilters ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out bg-background/80 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none p-6 md:p-0 glass-sidebar md:!border-none md:!shadow-none`}>
          <div className="flex justify-between items-center md:hidden mb-6">
            <h2 className="text-xl font-bold">Filters</h2>
            <button onClick={() => setShowMobileFilters(false)}>✕</button>
          </div>
          <FilterSidebar categoryPreselect={params.slug as string} />
        </div>

        {showMobileFilters && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowMobileFilters(false)} />}

        <div className="flex-1">
          <div className="glass-card flex flex-col sm:flex-row justify-between items-center p-4 mb-8">
            <p className="text-sm text-muted-foreground mb-4 sm:mb-0">Showing {products.length} results</p>
            <div className="flex items-center gap-4">
              <select className="glass-select py-2 px-4 rounded-md">
                <option value="featured">Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ToggleGroup.Root className="flex glass p-1 rounded-md" type="single" value={layout} onValueChange={(val) => val && setLayout(val)}>
                <ToggleGroup.Item value="grid-4" className={`p-2 rounded ${layout === "grid-4" ? "bg-white/20 text-white" : "text-muted-foreground"}`}><LayoutGrid size={20} /></ToggleGroup.Item>
                <ToggleGroup.Item value="list" className={`p-2 rounded ${layout === "list" ? "bg-white/20 text-white" : "text-muted-foreground"}`}><List size={20} /></ToggleGroup.Item>
              </ToggleGroup.Root>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card h-80 rounded-xl animate-pulse">
                  <div className="w-full h-48 bg-white/10 rounded-t-xl mb-4"></div>
                  <div className="w-3/4 h-4 bg-white/10 rounded mx-4 mb-2"></div>
                  <div className="w-1/2 h-4 bg-white/10 rounded mx-4"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={`grid gap-6 ${layout === "grid-4" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {products.map((product) => (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={product._id}>
                  <ProductCard product={product} layout={layout} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
