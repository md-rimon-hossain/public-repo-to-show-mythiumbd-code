"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setProducts([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setProducts([]);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  // Extract suggestions based on product names
  const suggestions = Array.from(new Set(products.map(p => {
    return p.name.length > 35 ? p.name.substring(0, 35) + "..." : p.name;
  }))).slice(0, 5);

  const renderSuggestion = (suggestion: string, q: string) => {
    if (!q) return suggestion;
    const idx = suggestion.toLowerCase().indexOf(q.toLowerCase());
    if (idx >= 0) {
      const before = suggestion.substring(0, idx);
      const match = suggestion.substring(idx, idx + q.length);
      const after = suggestion.substring(idx + q.length);
      return (
        <>
          <span className="text-muted-foreground font-normal">{before}</span>
          <span className="font-bold text-foreground">{match}</span>
          <span className="text-muted-foreground font-normal">{after}</span>
        </>
      );
    }
    return suggestion;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-0 md:pt-16 px-0 md:px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-5xl bg-background shadow-2xl relative z-10 flex flex-col md:rounded-xl overflow-hidden h-full md:h-auto max-h-[100vh] md:max-h-[85vh] border border-black/5 dark:border-neutral-800"
          >
            {/* Top Search Bar */}
            <div className="flex items-center border-b border-black/5 dark:border-neutral-800 p-4 md:p-6 gap-4">
              <div className="flex-1">
                <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Search</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full bg-transparent text-foreground text-xl md:text-2xl font-medium placeholder:text-muted-foreground/30 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                {query && (
                  <button 
                    onClick={() => setQuery("")}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Search className="text-muted-foreground w-5 h-5 md:w-6 md:h-6 ml-1 md:ml-2" />
                <div className="w-px h-8 bg-black/5 dark:bg-neutral-800 mx-1 md:mx-2 block" />
                <button 
                  onClick={onClose}
                  className="flex w-10 h-10 items-center justify-center rounded-full hover:bg-foreground/5 text-foreground transition-colors"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            {/* Results Area */}
            {query.trim() && (
              <div className="flex flex-col md:flex-row flex-1 overflow-y-auto min-h-[300px]">
                {/* Left Column: Suggestions */}
                <div className="w-full md:w-[35%] p-6 md:p-8 border-b md:border-b-0 md:border-r border-black/5 dark:border-neutral-800 bg-foreground/[0.01]">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-5">Suggestions</h3>
                  
                  {loading && !products.length ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul className="space-y-4">
                      {suggestions.map((sug, idx) => (
                        <li key={idx}>
                          <button 
                            onClick={() => setQuery(sug)}
                            className="text-foreground hover:text-foreground/80 text-sm md:text-base text-left transition-colors w-full"
                          >
                            {renderSuggestion(sug, debouncedQuery)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No suggestions found.</p>
                  )}

                  <div className="mt-8 pt-6 border-t border-black/5 dark:border-neutral-800">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Pages</h3>
                    <Link 
                      href={`/products?search=${encodeURIComponent(query)}`}
                      onClick={onClose}
                      className="flex items-center justify-between group py-2"
                    >
                      <span className="text-sm font-medium text-foreground">Search for "{query}"</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* Right Column: Products */}
                <div className="w-full md:w-[65%] p-6 md:p-8">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-5">Products</h3>
                  
                  {loading && !products.length ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <Link 
                          key={product._id} 
                          href={`/products/${product.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-4 p-2 rounded-xl hover:bg-foreground/5 transition-colors group"
                        >
                          <div className="w-16 h-20 relative rounded bg-foreground/5 flex-shrink-0">
                            <Image 
                              src={product.images[0] || 'https://via.placeholder.com/150'} 
                              alt={product.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm text-foreground line-clamp-2 leading-snug mb-1">{product.name}</h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Search className="w-8 h-8 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No products match your search.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
