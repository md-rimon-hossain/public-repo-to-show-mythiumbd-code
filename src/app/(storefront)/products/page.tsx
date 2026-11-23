"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FilterSidebar } from "@/components/product/filter-sidebar";
import { ProductCard } from "@/components/product/product-card";
import { formatPrice } from "@/lib/utils";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LayoutGrid, List, SlidersHorizontal, Loader2 } from "lucide-react";
import { IProduct } from "@/types";
import { motion } from "framer-motion";

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState("grid-4");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileFilters]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success) {
          setCategories(json.data.map((c: any) => ({ id: c._id, name: c.name, sizes: c.sizes })));
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const query = searchParams.toString();
        const res = await fetch(`/api/products${query ? `?${query}` : ""}`);
        const data = await res.json();
        setProducts(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]);

  const handleFilterChange = (filters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filters.categories?.length) {
      params.set("category", filters.categories[0]);
    } else {
      params.delete("category");
    }
    
    if (filters.sizes?.length) {
      params.set("sizes", filters.sizes.join(","));
    } else {
      params.delete("sizes");
    }
    
    if (filters.colors?.length) {
      params.set("colors", filters.colors.join(","));
    } else {
      params.delete("colors");
    }
    
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000)) {
      params.set("minPrice", filters.priceRange[0].toString());
      params.set("maxPrice", filters.priceRange[1].toString());
    } else {
      params.delete("minPrice");
      params.delete("maxPrice");
    }
    
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentFilters = React.useMemo(() => ({
    categories: searchParams.get("category") ? [searchParams.get("category")] : [],
    sizes: searchParams.get("sizes") ? searchParams.get("sizes")?.split(",") : [],
    colors: searchParams.get("colors") ? searchParams.get("colors")?.split(",") : [],
    availability: searchParams.get("availability") ? searchParams.get("availability")?.split(",") : [],
    priceRange: [
      Number(searchParams.get("minPrice") || 0), 
      Number(searchParams.get("maxPrice") || 7500)
    ]
  }), [searchParams]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (currentFilters.categories && currentFilters.categories.length > 0) count += 1;
    if (currentFilters.sizes && currentFilters.sizes.length > 0) count += currentFilters.sizes.length;
    if (currentFilters.colors && currentFilters.colors.length > 0) count += currentFilters.colors.length;
    if (currentFilters.availability && currentFilters.availability.length > 0) count += currentFilters.availability.length;
    if (currentFilters.priceRange && (currentFilters.priceRange[0] > 0 || currentFilters.priceRange[1] < 7500)) count += 1;
    return count;
  }, [currentFilters]);

  return (
    <div className="container mx-auto px-1 md:px-4 pb-8">
      <div className="flex flex-col md:flex-row gap-2">


        {/* Overlay */}
        {showMobileFilters && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] md:hidden transition-opacity"
            onClick={() => setShowMobileFilters(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed top-[72px] bottom-0 left-0 z-[90] w-full transform ${
            showMobileFilters ? "translate-x-0" : "-translate-x-full"
          } md:relative md:top-auto md:bottom-auto md:translate-x-0 md:z-0 md:w-[280px] transition-transform duration-150 ease-out bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 md:border-none md:pr-6 md:shadow-none`}
        >
          <FilterSidebar 
            categories={categories}
            currentFilters={currentFilters}
            onFilterChange={handleFilterChange}
            onCloseMobile={() => setShowMobileFilters(false)}
            className="w-full h-full"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="flex flex-row justify-between items-center pb-3 mb-4 md:pb-4 md:mb-6 border-b border-neutral-200 dark:border-neutral-800">
            {/* Mobile Left: Filters */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-foreground bg-neutral-100 dark:bg-neutral-900 px-3 py-2 border border-border/50 rounded-md"
            >
              <SlidersHorizontal size={14} />
              FILTERS {activeFilterCount > 0 && <span className="bg-foreground text-background w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{activeFilterCount}</span>}
            </button>

            {/* Desktop Left: Showing info */}
            <p className="hidden md:block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Showing {products.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>

            {/* Right: Mobile Info & Sort */}
            <div className="flex items-center gap-2 md:gap-4">
              <span className="md:hidden text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {pagination.total} {pagination.total === 1 ? 'ITEM' : 'ITEMS'}
              </span>
              <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700 md:hidden"></div>
              <select 
                className="bg-transparent border-none text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest py-1 md:py-2 focus:outline-none cursor-pointer text-foreground max-w-[90px] sm:max-w-[120px] md:max-w-full text-right md:text-left"
                value={searchParams.get("sort") || "newest"}
                onChange={handleSortChange}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_low">Low to High</option>
                <option value="price_high">High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 animate-pulse">
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1 md:gap-1">
              {products.map((product) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={product._id}
                >
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-16">
              <button 
                className="w-10 h-10 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 disabled:opacity-30 hover:border-black dark:hover:border-white transition-colors"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                &larr;
              </button>
              
              {[...Array(pagination.totalPages)].map((_, i) => {
                const isActive = pagination.page === i + 1;
                return (
                  <button 
                    key={i + 1}
                    className={`w-10 h-10 flex items-center justify-center text-xs font-bold border transition-colors ${
                      isActive 
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' 
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white'
                    }`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                );
              })}
              
              <button 
                className="w-10 h-10 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 disabled:opacity-30 hover:border-black dark:hover:border-white transition-colors"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}

