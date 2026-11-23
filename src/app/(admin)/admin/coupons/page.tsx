"use client";

import React, { useEffect, useState } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Ticket, Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);

  const [form, setForm] = useState({
    code: '', discountType: 'percentage' as 'percentage' | 'fixed', discountValue: '', minOrderAmount: '0', maxUses: '-1', expiresAt: '', isActive: true,
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.success) setCoupons(data.data);
    } catch { toast.error('Failed to load coupons'); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '0', maxUses: '-1', expiresAt: futureDate.toISOString().split('T')[0], isActive: true });
    setShowModal(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code, discountType: coupon.discountType, discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount || 0), maxUses: String(coupon.maxUses || -1),
      expiresAt: new Date(coupon.expiresAt).toISOString().split('T')[0], isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiresAt) { toast.error('All fields are required'); return; }
    try {
      setSaving(true);
      const body = {
        code: form.code, discountType: form.discountType, discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount), maxUses: Number(form.maxUses),
        expiresAt: new Date(form.expiresAt).toISOString(), isActive: form.isActive,
      };
      const url = editing ? `/api/coupons/${editing._id}` : '/api/coupons';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { toast.success(editing ? 'Coupon updated' : 'Coupon created'); setShowModal(false); fetchCoupons(); }
      else toast.error(data.errors?.[0]?.message || data.message || 'Failed');
    } catch { toast.error('An error occurred'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Coupon deleted'); setShowDeleteModal(null); fetchCoupons(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Failed'); } finally { setDeleting(null); }
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center gap-2 md:gap-4 border-b border-border pb-3 md:pb-6">
        <div>
          <h1 className="text-xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-1 md:mb-2">Coupons</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-[10px] md:text-sm uppercase tracking-widest md:tracking-[0.2em] font-semibold">Manage discount codes.</p>
        </div>
        <button onClick={openCreate} className="px-3 md:px-6 py-2 md:py-3 border border-border font-semibold text-[10px] md:text-xs hover:bg-foreground hover:text-background transition-colors flex items-center gap-1 md:gap-2 rounded-lg whitespace-nowrap">
          <Plus size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">New Coupon</span><span className="sm:hidden">New</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinnerIphone />
      ) : coupons.length === 0 ? (
        <div className="border border-border bg-background rounded-xl p-12 text-center text-muted-foreground">
          <Ticket size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold ">No coupons yet. Create your first discount code.</p>
        </div>
      ) : (
        <div className="border-0 md:border border-border bg-transparent md:bg-background rounded-none md:rounded-xl p-0 md:p-6">
          {/* Mobile Cards Layout */}
          <div className="grid grid-cols-1 gap-2 md:hidden">
            {coupons.map((coupon) => (
              <div key={coupon._id} className="bg-background border border-border p-3 flex flex-col relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 border border-border bg-background text-foreground font-black text-[11px] uppercase">
                    {coupon.code}
                  </span>
                  <span className={`inline-block px-1.5 py-0.5 border text-[8px] font-black tracking-widest uppercase ${coupon.isActive && !isExpired(coupon.expiresAt) ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-muted-foreground text-muted-foreground'}`}>
                    {coupon.isActive && !isExpired(coupon.expiresAt) ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[13px] text-emerald-500 font-black">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `৳${coupon.discountValue} OFF`}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase mt-0.5">
                      MIN: ৳{coupon.minOrderAmount || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">
                      USES: {coupon.currentUses || 0}{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ''}
                    </p>
                    <p className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${isExpired(coupon.expiresAt) ? 'text-red-500' : 'text-muted-foreground'}`}>
                      EXP: {new Date(coupon.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                  <button onClick={() => openEdit(coupon)} className="p-1.5 border border-border bg-muted/30 text-blue-500 hover:bg-blue-500/10">
                    <Edit size={12} />
                  </button>
                  <button onClick={() => setShowDeleteModal(coupon)} className="p-1.5 border border-border bg-muted/30 text-red-500 hover:bg-red-500/10">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-2">Code</th>
                  <th className="py-3 px-2">Discount</th>
                  <th className="py-3 px-2">Min. Order</th>
                  <th className="py-3 px-2">Expiry</th>
                  <th className="py-3 px-2">Uses</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-bold text-foreground uppercase ">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 border border-border bg-background text-foreground font-black ">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-emerald-500 font-black">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `৳${coupon.discountValue} OFF`}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">৳{coupon.minOrderAmount || 0}</td>
                    <td className="py-3 px-2 text-[10px]">
                      <span className={isExpired(coupon.expiresAt) ? 'text-red-500 font-black' : 'text-muted-foreground'}>
                        {new Date(coupon.expiresAt).toLocaleDateString()}
                        {isExpired(coupon.expiresAt) && ' (EXPIRED)'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{coupon.currentUses || 0}{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ''}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-1 border text-[9px] font-black tracking-widest uppercase ${coupon.isActive && !isExpired(coupon.expiresAt) ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-muted-foreground text-muted-foreground'}`}>
                        {coupon.isActive && !isExpired(coupon.expiresAt) ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(coupon)} className="p-2 border border-transparent hover:border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setShowDeleteModal(coupon)} className="p-2 border border-transparent hover:border-red-500 text-red-500 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="border border-border bg-background rounded-xl p-4 md:p-6 lg:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-border pb-3 md:pb-4">
              <h3 className="text-lg md:text-2xl font-bold tracking-tighter text-foreground">{editing ? 'EDIT COUPON' : 'New Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} className="md:w-5 md:h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">COUPON CODE *</label>
                <input type="text" className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest" placeholder="E.G. WINTER20" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required />
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">DISCOUNT TYPE *</label>
                  <select className="w-full px-2 md:px-4 py-2.5 md:py-3 bg-background border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest appearance-none" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value as any})}>
                    <option value="percentage">PERCENTAGE (%)</option>
                    <option value="fixed">FIXED AMOUNT (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">VALUE *</label>
                  <input type="number" className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-transparent border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest" placeholder="E.G. 20" min="1" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">MIN. ORDER (৳)</label>
                  <input type="number" className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-transparent border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest" min="0" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2 truncate">MAX USES (-1 = UNLIMIT)</label>
                  <input type="number" className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-transparent border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest" min="-1" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">EXPIRES AT *</label>
                <input type="date" className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-background border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer border border-border p-3 md:p-4 hover:border-foreground transition-colors">
                <input type="checkbox" className="w-4 h-4 accent-foreground" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                <span className="text-[10px] md:text-xs font-medium text-foreground uppercase">ACTIVE COUPON</span>
              </label>
              <div className="flex gap-2 md:gap-3 pt-3 md:pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 md:py-3 border border-border font-semibold text-[10px] md:text-xs hover:border-foreground transition-colors uppercase">CANCEL</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 md:py-3 border border-border bg-foreground text-background font-semibold text-[10px] md:text-xs hover:bg-transparent hover:text-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-50 uppercase">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'UPDATE' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4" onClick={() => setShowDeleteModal(null)}>
          <div className="border border-border bg-background rounded-xl p-4 md:p-6 lg:p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg md:text-2xl font-bold tracking-tighter text-foreground mb-1 md:mb-2">DELETE COUPON</h3>
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground mb-4 md:mb-6">Delete coupon <span className="text-foreground font-black">{showDeleteModal.code}</span>?</p>
            <div className="flex gap-2 md:gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(null)} className="px-4 md:px-6 py-2.5 md:py-3 border border-border font-semibold text-[10px] md:text-xs hover:border-foreground transition-colors">CANCEL</button>
              <button onClick={() => handleDelete(showDeleteModal._id)} disabled={deleting === showDeleteModal._id} className="px-4 md:px-6 py-2.5 md:py-3 border-2 border-red-500 bg-red-500/10 text-red-500 font-semibold text-[10px] md:text-xs hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50">
                {deleting === showDeleteModal._id && <Loader2 size={14} className="animate-spin" />} DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
