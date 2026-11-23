"use client";

import React, { useEffect, useState, useCallback } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Package, Eye, ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const ORDER_STATUSES = ['pending', 'in_review', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'border-amber-500 text-amber-500 bg-amber-500/5',
  in_review: 'border-orange-500 text-orange-500 bg-orange-500/5',
  confirmed: 'border-purple-500 text-purple-500 bg-purple-500/5',
  processing: 'border-blue-500 text-blue-500 bg-blue-500/5',
  shipped: 'border-teal-500 text-teal-500 bg-teal-500/5',
  out_for_delivery: 'border-indigo-500 text-indigo-500 bg-indigo-500/5',
  delivered: 'border-emerald-500 text-emerald-500 bg-emerald-500/5',
  cancelled: 'border-red-500 text-red-500 bg-red-500/5',
  returned: 'border-orange-500 text-orange-500 bg-orange-500/5',
  paid: 'border-emerald-500 text-emerald-500 bg-emerald-500/5',
  failed: 'border-red-500 text-red-500 bg-red-500/5',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'drafts'>('orders');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      params.set('adminView', 'true');
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        let filtered = data.data;
        if (statusFilter) filtered = filtered.filter((o: any) => o.orderStatus === statusFilter);
        setOrders(filtered);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/draft-orders/list`);
      const data = await res.json();
      if (data.success) {
        setDrafts(data.data);
      }
    } catch {
      toast.error('Failed to load draft links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'drafts') {
        setActiveTab('drafts');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchDrafts();
    }
  }, [activeTab, fetchOrders, fetchDrafts]);

  const deleteDraft = (draftId: string) => {
    setDeleteDraftId(draftId);
  };

  const confirmDelete = async () => {
    if (!deleteDraftId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/draft-orders/${deleteDraftId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Draft order deleted');
        fetchDrafts();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsDeleting(false);
      setDeleteDraftId(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
        setOpenDropdown(null);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 sm:mb-2 truncate">Orders {pagination?.total ? `(${pagination.total})` : ''}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-[9px] sm:text-xs md:text-sm uppercase tracking-wider sm:tracking-[0.2em] font-semibold truncate">Manage and track customer orders</p>
        </div>
        <Link href="/admin/orders/create" className="shrink-0 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-none bg-foreground text-background font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 hover:opacity-90">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4"/> <span className="hidden sm:inline">Create Custom Order</span><span className="sm:hidden">Create</span>
        </Link>
      </div>

      <div className="flex gap-4 sm:gap-6 border-b border-border">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-2 sm:pb-3 text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'orders' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Final Orders
        </button>
        <button 
          onClick={() => setActiveTab('drafts')}
          className={`pb-2 sm:pb-3 text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'drafts' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Generated Draft Links
        </button>
      </div>

      {/* Status filter pills (Only for Orders) */}
      {activeTab === 'orders' && (
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <button onClick={() => { setStatusFilter(''); setPage(1); }} className={`px-3 sm:px-4 py-1.5 sm:py-2 border text-[9px] sm:text-[11px] font-semibold capitalize rounded-md sm:rounded-lg transition-colors ${!statusFilter ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'}`}>All</button>
          {ORDER_STATUSES.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 sm:px-4 py-1.5 sm:py-2 border text-[9px] sm:text-[11px] font-semibold capitalize rounded-md sm:rounded-lg transition-colors ${statusFilter === s ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      <div className="border border-border bg-background rounded-xl p-4 lg:p-6">
        {loading ? (
          <LoadingSpinnerIphone />
        ) : activeTab === 'orders' && orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-xs font-medium">No orders found</p>
          </div>
        ) : activeTab === 'drafts' && drafts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <LinkIcon size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-xs font-medium">No draft links generated yet</p>
          </div>
        ) : activeTab === 'orders' ? (
          <>
            {/* Mobile Card Layout */}
            <div className="grid grid-cols-1 gap-3 pb-2 md:hidden">
              {orders.map((order) => (
                <div key={order._id} className="border border-border/60 bg-muted/10 rounded-xl p-3 flex flex-col gap-3 relative shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="block font-black text-xs text-foreground">{order.invoice}</span>
                        {order.isCustomAdminOrder && (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-blue-500/50 text-blue-500 bg-blue-500/10">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-muted-foreground">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-sm text-emerald-500 mb-1">{formatPrice(order.totalAmount)}</span>
                      <span className="block text-[9px] text-muted-foreground uppercase tracking-wider">{order.items?.length || 0} ITEMS</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-sm ${STATUS_BADGE[order.paymentStatus] || 'border-muted-foreground text-muted-foreground'}`}>
                        {order.paymentStatus}
                      </span>
                      <span className={`px-1.5 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-sm ${STATUS_BADGE[order.orderStatus] || 'border-muted-foreground text-muted-foreground'}`}>
                        {order.orderStatus?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Link href={`/admin/orders/${order._id}`} className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md bg-background">
                      <Eye size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                    <th className="py-3 px-2">Invoice</th>
                    <th className="py-3 px-2 text-center">Items</th>
                    <th className="py-3 px-2">Total</th>
                    <th className="py-3 px-2">Payment</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-medium text-foreground">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-foreground/5 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black">{order.invoice}</span>
                          {order.isCustomAdminOrder && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-blue-500/50 text-blue-500 bg-blue-500/10">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-muted-foreground">{order.items?.length || 0}</td>
                      <td className="py-3 px-2 text-emerald-500">{formatPrice(order.totalAmount)}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 border text-[10px] font-semibold rounded-md capitalize ${STATUS_BADGE[order.paymentStatus] || 'border-muted-foreground text-muted-foreground'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 border text-[10px] font-semibold rounded-md capitalize inline-block ${STATUS_BADGE[order.orderStatus] || 'border-muted-foreground text-muted-foreground'}`}>
                          {order.orderStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-2 text-right">
                        <Link href={`/admin/orders/${order._id}`} className="p-2 border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-colors inline-flex rounded-lg">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Mobile Card Layout for Drafts */}
            <div className="grid grid-cols-1 gap-3 pb-2 md:hidden">
              {drafts.map((draft) => {
                const isExpired = draft.expiresAt && new Date() > new Date(draft.expiresAt);
                const isCompleted = draft.status === 'completed';
                return (
                  <div key={draft._id} className="border border-border/60 bg-muted/10 rounded-xl p-3 flex flex-col gap-3 relative shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="block font-mono font-bold text-[10px] text-foreground mb-1">{draft.linkId}</span>
                        <span className="block text-[11px] font-bold text-foreground">
                          {draft.prefilledCustomerDetails?.fullName || <span className="text-muted-foreground italic font-normal">Anonymous</span>}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-sm text-emerald-500 mb-1">{formatPrice(draft.totalAmount)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <span className="px-1.5 py-0.5 border border-emerald-500/50 text-emerald-500 bg-emerald-500/5 text-[8px] font-black tracking-widest rounded-sm uppercase">Completed</span>
                        ) : isExpired ? (
                          <span className="px-1.5 py-0.5 border border-red-500/50 text-red-500 bg-red-500/5 text-[8px] font-black tracking-widest rounded-sm uppercase">Expired</span>
                        ) : (
                          <span className="px-1.5 py-0.5 border border-blue-500/50 text-blue-500 bg-blue-500/5 text-[8px] font-black tracking-widest rounded-sm uppercase">Active</span>
                        )}
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                          {draft.expiresAt ? `Exp: ${new Date(draft.expiresAt).toLocaleDateString()}` : 'No Expiry'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/checkout/draft/${draft.linkId}`);
                            toast.success('Link copied!');
                          }}
                          className="text-[9px] font-black uppercase tracking-wider bg-foreground text-background hover:bg-foreground/80 px-2 py-1.5 rounded-md transition-colors"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => deleteDraft(draft._id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 border border-border bg-background rounded-md transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout for Drafts */}
            <div className="hidden md:block overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                    <th className="py-3 px-2">Link ID</th>
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Total</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Expires</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-medium text-foreground">
                  {drafts.map((draft) => {
                    const isExpired = draft.expiresAt && new Date() > new Date(draft.expiresAt);
                    const isCompleted = draft.status === 'completed';
                    return (
                      <tr key={draft._id} className="hover:bg-foreground/5 transition-colors">
                        <td className="py-3 px-2 font-mono font-bold">{draft.linkId}</td>
                        <td className="py-3 px-2">
                          {draft.prefilledCustomerDetails?.fullName || <span className="text-muted-foreground italic">Anonymous</span>}
                        </td>
                        <td className="py-3 px-2 text-emerald-500 font-bold">{formatPrice(draft.totalAmount)}</td>
                        <td className="py-3 px-2">
                          {isCompleted ? (
                            <span className="px-2 py-1 border border-emerald-500 text-emerald-500 bg-emerald-500/5 text-[10px] font-bold rounded-md uppercase">Completed</span>
                          ) : isExpired ? (
                            <span className="px-2 py-1 border border-red-500 text-red-500 bg-red-500/5 text-[10px] font-bold rounded-md uppercase">Expired</span>
                          ) : (
                            <span className="px-2 py-1 border border-blue-500 text-blue-500 bg-blue-500/5 text-[10px] font-bold rounded-md uppercase">Active</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {draft.expiresAt ? new Date(draft.expiresAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/checkout/draft/${draft.linkId}`);
                                toast.success('Link copied to clipboard!');
                              }}
                              className="text-xs font-bold bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Copy Link
                            </button>
                            <button
                              onClick={() => deleteDraft(draft._id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {activeTab === 'orders' && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <span className="text-xs font-medium text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-border rounded-lg hover:border-foreground hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={18} /></button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-border rounded-lg hover:border-foreground hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />}

      {/* Delete Confirmation Modal */}
      {deleteDraftId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            {/* Warning header strip */}
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-black mb-2">Delete Draft Link</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this draft link? Customers will immediately lose access to this checkout page. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  disabled={isDeleting}
                  onClick={() => setDeleteDraftId(null)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
