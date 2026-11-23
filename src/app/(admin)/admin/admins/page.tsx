"use client";

import React, { useEffect, useState } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { UserCog, Plus, ShieldBan, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState<any>(null);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users?role=admin,superadmin&limit=100');
      const data = await res.json();
      if (data.success) setAdmins(data.data);
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setAdding(true);
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User promoted to admin');
        setShowAddModal(false);
        setEmail('');
        fetchAdmins();
      } else {
        toast.error(data.message || 'Failed to add admin');
      }
    } catch {
      toast.error('Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    try {
      setRemoving(adminId);
      const res = await fetch(`/api/users/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin demoted to user');
        setShowRemoveModal(null);
        fetchAdmins();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Failed to remove admin');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-2">Administrators</h1>
          <p className="text-muted-foreground mt-2 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold">Manage dashboard access and roles.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 border border-border font-semibold text-xs hover:bg-foreground hover:text-background transition-colors flex items-center gap-2 rounded-lg">
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {loading ? (
        <LoadingSpinnerIphone />
      ) : admins.length === 0 ? (
        <div className="border border-border bg-background rounded-xl p-12 text-center text-muted-foreground">
          <UserCog size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold ">No administrators found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin) => (
            <div key={admin._id} className="border border-border bg-background rounded-xl p-6 relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {admin.role !== 'superadmin' && (
                  <button onClick={() => setShowRemoveModal(admin)} className="p-2 border border-transparent hover:border-red-500 text-red-500 hover:bg-red-500/10 transition-colors" title="REMOVE ADMIN">
                    <ShieldBan size={16} />
                  </button>
                )}
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center text-xl font-black text-background mb-4">
                  {admin.image ? (
                    <Image src={admin.image} alt={admin.name} width={64} height={64} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserCog size={24} />
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground ">{admin.name || 'Unknown'}</h3>
                <p className="text-xs font-medium text-muted-foreground mt-1 mb-4">{admin.email}</p>
                <span className={`px-4 py-1 border text-xs font-medium ${
                  admin.role === 'superadmin' ? 'border-purple-500 text-purple-500 bg-purple-500/5' : 'border-blue-500 text-blue-500 bg-blue-500/5'
                }`}>
                  {admin.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="border border-border bg-background rounded-xl p-6 lg:p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground">ADD ADMINISTRATOR</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Enter the email address of an existing user to promote them to admin role.</p>
            <form onSubmit={handleAddAdmin} className="space-y-6">
              <input type="email" className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest placeholder:text-muted-foreground/50" placeholder="USER@EXAMPLE.COM" value={email} onChange={e => setEmail(e.target.value)} required />
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-border font-semibold text-xs hover:border-foreground transition-colors">CANCEL</button>
                <button type="submit" disabled={adding} className="flex-1 py-3 border border-border bg-foreground text-background font-semibold text-xs hover:bg-transparent hover:text-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {adding && <Loader2 size={16} className="animate-spin" />}
                  PROMOTE TO ADMIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Admin Confirmation */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowRemoveModal(null)}>
          <div className="border border-border bg-background rounded-xl p-6 lg:p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground mb-2">REMOVE ADMIN</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              Demote <span className="text-foreground font-black">{showRemoveModal.name || showRemoveModal.email}</span> back to regular user?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRemoveModal(null)} className="px-6 py-3 border border-border font-semibold text-xs hover:border-foreground transition-colors">CANCEL</button>
              <button onClick={() => handleRemoveAdmin(showRemoveModal._id)} disabled={removing === showRemoveModal._id} className="px-6 py-3 border-2 border-red-500 bg-red-500/10 text-red-500 font-semibold text-xs hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50">
                {removing === showRemoveModal._id && <Loader2 size={16} className="animate-spin" />}
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
