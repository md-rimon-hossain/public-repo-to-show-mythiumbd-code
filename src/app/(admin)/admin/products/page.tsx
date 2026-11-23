"use client";

import React, { useEffect, useState, useCallback } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Search, Eye, Edit, Trash2, ExternalLink, Package, Filter, ChevronLeft, ChevronRight, TrendingUp, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function AllProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        let filtered = data.data;
        if (statusFilter) {
          filtered = filtered.filter((p: any) => p.status === statusFilter);
        }
        setProducts(filtered);
        setPagination(data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(debounce);
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted successfully');
        setShowDeleteModal(null);
        fetchProducts();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-1.5 sm:mb-2 truncate">All Products</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-[9px] sm:text-xs md:text-sm uppercase tracking-wider sm:tracking-[0.2em] font-semibold truncate">
            {pagination ? `${pagination.total} products in catalog` : 'Loading...'}
          </p>
        </div>
        <Link href="/admin/products/create" className="px-3 sm:px-6 py-2 sm:py-3 border border-border font-bold text-[10px] sm:text-xs hover:bg-foreground hover:text-background transition-colors flex items-center gap-1.5 sm:gap-2 rounded-lg whitespace-nowrap shrink-0">
          <Package size={14} className="sm:w-4 sm:h-4" /> New Product
        </Link>
      </div>

      <div className="border border-border bg-background rounded-xl p-4 lg:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="relative flex-1 w-full max-w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={14} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-1.5 md:py-2 bg-transparent border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold transition-colors placeholder:text-foreground/30 rounded-md"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-1.5 md:gap-2 flex-wrap w-full md:w-auto">
            {['', 'active', 'draft', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-2 md:px-4 py-1.5 md:py-2 border text-[9px] md:text-xs font-black uppercase tracking-wider transition-colors flex-1 md:flex-none text-center rounded-md ${
                  statusFilter === status
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {status ? status : 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 max-w-sm mx-auto">
          <LoadingSpinnerIphone />
        </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-xs font-bold ">No products found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="grid grid-cols-1 gap-3 pb-2 md:hidden">
              {products.map((product: any) => (
                <div key={product._id} className="border border-border/60 bg-muted/10 rounded-xl p-3 flex flex-col gap-3 relative shadow-sm">
                  <div className="flex items-start gap-3">
                    {product.images?.[0] ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-border/50 bg-background flex-shrink-0">
                        <Image src={product.images[0]} alt={product.title} width={56} height={56} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-border/50 bg-background flex items-center justify-center flex-shrink-0">
                        <Package size={20} className="text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="block font-bold text-xs truncate text-foreground">{product.title}</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5 truncate uppercase tracking-wider">{typeof product.category === 'object' ? product.category?.name : product.category || '-'}</span>
                      {product.isTrending && (
                        <span className="inline-flex items-center gap-1 text-[8px] text-foreground border border-border px-1.5 py-0.5 mt-1 rounded-sm bg-background">
                          <TrendingUp size={8} /> TRENDING
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="block font-black text-sm text-foreground">{formatPrice(product.discountPrice)}</span>
                      {product.totalSave > 0 && (
                        <span className="block text-[9px] text-muted-foreground line-through">{formatPrice(product.regularPrice)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 border text-[8px] font-black tracking-widest rounded-sm ${
                          product.totalQuantity > 10 ? 'border-border text-foreground bg-background' :
                          product.totalQuantity > 0 ? 'border-amber-500/50 text-amber-500 bg-amber-500/5' :
                          'border-red-500/50 text-red-500 bg-red-500/5'
                        }`}>
                          {product.totalQuantity > 0 ? `${product.totalQuantity} IN STOCK` : 'OUT OF STOCK'}
                        </span>
                        <span className={`px-1.5 py-0.5 border text-[8px] font-black tracking-widest rounded-sm ${
                          product.status === 'active' ? 'border-border text-foreground bg-foreground/5' :
                          product.status === 'draft' ? 'border-amber-500/50 text-amber-500 bg-amber-500/5' :
                          'border-muted-foreground/50 text-muted-foreground bg-muted-foreground/5'
                        }`}>
                          {product.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/products/${product.slug}`} target="_blank" className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md">
                        <ExternalLink size={14} />
                      </Link>
                      <Link href={`/admin/products/create?edit=${product._id}`} className="p-1.5 text-blue-500 hover:bg-blue-500/10 transition-colors rounded-md">
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={() => setShowDeleteModal(product)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 transition-colors rounded-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-2">Product</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Price</th>
                  <th className="py-3 px-2">Stock</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-bold text-foreground uppercase ">
                {products.map((product: any) => (
                  <tr key={product._id} className="hover:bg-muted/20 transition-colors group">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt={product.title} width={48} height={48} className="w-10 h-10 object-contain border border-foreground/10" />
                        ) : (
                          <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center">
                            <Package size={16} className="text-foreground/30" />
                          </div>
                        )}
                        <div>
                          <span className="block">{product.title}</span>
                          {product.isTrending && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-foreground border border-border px-1 mt-1">
                              <TrendingUp size={8} /> TRENDING
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {typeof product.category === 'object' ? product.category?.name : product.category || '-'}
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <span className="block">{formatPrice(product.discountPrice)}</span>
                        {product.totalSave > 0 && (
                          <span className="block text-[10px] text-muted-foreground line-through">{formatPrice(product.regularPrice)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 border text-[9px] font-black tracking-widest ${
                        product.totalQuantity > 10 ? 'border-border text-foreground' :
                        product.totalQuantity > 0 ? 'border-amber-500 text-amber-500' :
                        'border-red-500 text-red-500'
                      }`}>
                        {product.totalQuantity > 0 ? `${product.totalQuantity} IN STOCK` : 'OUT OF STOCK'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 border text-[9px] font-black tracking-widest ${
                        product.status === 'active' ? 'border-border text-foreground bg-muted/30' :
                        product.status === 'draft' ? 'border-amber-500 text-amber-500' :
                        'border-muted-foreground text-muted-foreground'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/products/${product.slug}`} target="_blank" className="p-2 border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink size={16} />
                        </Link>
                        <Link href={`/admin/products/create?edit=${product._id}`} className="p-2 border border-transparent hover:border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors">
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(product)}
                          className="p-2 border border-transparent hover:border-red-500 text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}

        {/* Pagination */}
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground">
              PAGE {pagination.page} OF {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-border hover:border-foreground hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-border hover:border-foreground hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" onClick={() => setShowDeleteModal(null)}>
          <div className="border border-red-500/20 bg-background rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl shadow-red-500/10 animate-in zoom-in-95 duration-200 flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 mt-1">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground mb-1 sm:mb-2">Delete Product</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Are you sure you want to delete <span className="text-foreground font-black">"{showDeleteModal.title}"</span>? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 sm:justify-end mt-2">
              <button onClick={() => setShowDeleteModal(null)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border border-border rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-muted/30 transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal._id)}
                disabled={deleting === showDeleteModal._id}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border-2 border-red-500 bg-red-500/10 text-red-500 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting === showDeleteModal._id && <Loader2 size={16} className="animate-spin" />}
                {deleting === showDeleteModal._id ? 'DELETING...' : 'YES, DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
