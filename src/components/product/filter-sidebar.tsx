"use client";

import { useState, useEffect } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Filter, X } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  categories?: { id: string; name: string; sizes?: string[] }[];
  currentFilters?: any;
  onFilterChange?: (filters: any) => void;
  className?: string;
  categoryPreselect?: string;
  onCloseMobile?: () => void;
}

export function FilterSidebar({ categories = [], currentFilters, onFilterChange = () => {}, className, categoryPreselect, onCloseMobile }: FilterSidebarProps) {
  const [filters, setFilters] = useState(currentFilters || {
    categories: categoryPreselect ? [categoryPreselect] : [],
    sizes: [],
    priceRange: [0, 7500],
    colors: [],
    availability: []
  });

  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([0, 7500]);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  useEffect(() => {
    if (filters.priceRange) {
      setLocalPriceRange(filters.priceRange as [number, number]);
    }
  }, [filters.priceRange]);

  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL", "28", "29", "30", "31", "32", "33", "34", "36", "38", "40"];
  const colors = ["Ivory White", "White", "Black", "Navy", "Olive", "Gray", "Red"];

  const selectedCategory = categories.find(c => (filters.categories || []).includes(c.id));
  const displaySizes = selectedCategory?.sizes?.length ? selectedCategory.sizes : defaultSizes;

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (isDesktop) {
      onFilterChange(newFilters);
    }
  };

  const toggleArrayItem = (key: string, item: string) => {
    const currentArray = filters[key] || [];
    const arr = [...currentArray];
    const index = arr.indexOf(item);
    if (index > -1) arr.splice(index, 1);
    else arr.push(item);
    updateFilter(key, arr);
  };

  const clearFilters = () => {
    const reset = { categories: [], sizes: [], priceRange: [0, 7500], colors: [], availability: [] };
    setFilters(reset);
    setLocalPriceRange([0, 7500]);
    onFilterChange(reset);
  };

  const handleApply = () => {
    onFilterChange({ ...filters, priceRange: localPriceRange });
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-5 pt-1 md:p-0 md:mb-4 md:pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
        <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
          <Filter className="h-4 w-4 hidden md:block" /> FILTERS
        </h3>
        
        <div className="flex items-center gap-4">
          <button onClick={clearFilters} className="hidden md:block text-xs text-red-600 dark:text-red-500 font-bold uppercase tracking-widest underline decoration-red-600/30 hover:decoration-red-600 dark:decoration-red-500/30 transition-colors">
            Clear All
          </button>
          
          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-3">
             <button onClick={clearFilters} className="text-[10px] text-red-600 font-bold uppercase underline tracking-widest">
              Clear All
            </button>
            <button onClick={handleApply} className="text-[10px] bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-bold uppercase tracking-widest">
              Apply
            </button>
            <button onClick={onCloseMobile} className="text-3xl leading-none -mt-1 font-light hover:opacity-50 transition-opacity">
              &times;
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-0 pb-20 md:pb-0">

      <Accordion.Root type="multiple" defaultValue={["categories", "price", "sizes", "colors", "availability"]} className="space-y-4">
        <Accordion.Item value="categories" className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-2 text-sm font-bold uppercase tracking-wider group">
              Categories
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pt-2 overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm cursor-pointer hover:opacity-80">
                <input
                  type="radio"
                  name="category"
                  checked={!filters.categories || filters.categories.length === 0}
                  onChange={() => updateFilter("categories", [])}
                  className="w-4 h-4 border-black dark:border-white text-black focus:ring-black dark:focus:ring-white bg-transparent"
                />
                <span className="font-medium">All Categories</span>
              </label>
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-3 text-sm cursor-pointer hover:opacity-80">
                  <input
                    type="radio"
                    name="category"
                    checked={(filters.categories || []).includes(cat.id)}
                    onChange={() => updateFilter("categories", [cat.id])}
                    className="w-4 h-4 border-black dark:border-white text-black focus:ring-black dark:focus:ring-white bg-transparent"
                  />
                  <span className="font-medium">{cat.name}</span>
                </label>
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="sizes" className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-2 text-sm font-bold uppercase tracking-wider group">
              Sizes
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pt-2 overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
            <div className="flex flex-wrap gap-2">
              {displaySizes.map(size => (
                <button
                  key={size}
                  onClick={() => toggleArrayItem("sizes", size)}
                  className={cn(
                    "h-8 min-w-[2.5rem] px-2 text-xs font-bold transition-colors border",
                    (filters.sizes || []).includes(size)
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "bg-transparent border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="price" className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-2 text-sm font-bold uppercase tracking-wider group">
              Price Range
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pt-2 overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
            <div className="flex items-center gap-4">
              <div className="flex flex-col w-full gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Min (BDT)</label>
                <input 
                  type="number" 
                  value={localPriceRange[0]} 
                  onChange={(e) => setLocalPriceRange([Number(e.target.value), localPriceRange[1]])}
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 p-2 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  min={0}
                />
              </div>
              <div className="text-xl font-black text-neutral-400 mt-4">-</div>
              <div className="flex flex-col w-full gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Max (BDT)</label>
                <input 
                  type="number" 
                  value={localPriceRange[1]} 
                  onChange={(e) => setLocalPriceRange([localPriceRange[0], Number(e.target.value)])}
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 p-2 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  min={0}
                />
              </div>
            </div>
            {(localPriceRange[0] !== (filters.priceRange?.[0] ?? 0) || localPriceRange[1] !== (filters.priceRange?.[1] ?? 7500)) && (
              <button 
                onClick={() => updateFilter("priceRange", localPriceRange)}
                className="w-full mt-3 bg-black dark:bg-white text-white dark:text-black py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Apply
              </button>
            )}
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="colors" className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-2 text-sm font-bold uppercase tracking-wider group">
              Colors
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pt-2 overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
            <div className="space-y-2">
              {colors.map(color => (
                <label key={color} className="flex items-center gap-3 text-sm cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={(filters.colors || []).includes(color)}
                    onChange={() => toggleArrayItem("colors", color)}
                    className="w-4 h-4 border-black dark:border-white text-black focus:ring-black dark:focus:ring-white bg-transparent rounded-none"
                  />
                  <span className="font-medium">{color}</span>
                </label>
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="availability" className="pb-4">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-2 text-sm font-bold uppercase tracking-wider group">
              Availability
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pt-2 overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm cursor-pointer hover:opacity-80">
                <input
                  type="checkbox"
                  checked={(filters.availability || []).includes("in_stock")}
                  onChange={() => toggleArrayItem("availability", "in_stock")}
                  className="w-4 h-4 border-black dark:border-white text-black focus:ring-black dark:focus:ring-white bg-transparent rounded-none"
                />
                <span className="font-medium">In Stock</span>
              </label>
              <label className="flex items-center gap-3 text-sm cursor-not-allowed opacity-50">
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  className="w-4 h-4 border-neutral-400 text-neutral-400 bg-transparent rounded-none"
                />
                <span className="font-medium line-through">Out of Stock</span>
              </label>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      </div>
    </div>
  );

  return (
    <div className={className}>
      {sidebarContent}
    </div>
  );
}
