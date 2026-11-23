"use client";

import React, { useEffect, useState, useCallback } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Search, Ban, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Users as UsersIcon, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      setToggling(userId);
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBlocked: !isBlocked }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isBlocked ? 'User unblocked' : 'User blocked');
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Failed to update user');
    } finally {
      setToggling(null);
    }
  };

  const openUserDetail = async (userId: string) => {
    try {
      setViewLoading(true);
      setViewUser(null);
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      if (data.success) setViewUser(data.data);
      else toast.error('Failed to load user details');
    } catch {
      toast.error('Failed');
    } finally {
      setViewLoading(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4 border-b border-border pb-3 md:pb-6">
        <div>
          <h1 className="text-xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-1 md:mb-2">Users</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-[10px] md:text-sm uppercase tracking-widest md:tracking-[0.2em] font-semibold">Manage customer accounts. {pagination ? `(${pagination.total} TOTAL)` : ''}</p>
        </div>
      </div>

      <div className="border-0 md:border border-border bg-transparent md:bg-background rounded-none md:rounded-xl p-0 md:p-6 space-y-4 md:space-y-6">
        <div className="relative max-w-md bg-background md:bg-transparent">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="SEARCH USERS BY NAME OR EMAIL..."
            className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-transparent border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest placeholder:text-muted-foreground rounded-none md:rounded-none"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        {loading ? (
          <LoadingSpinnerIphone />
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <UsersIcon size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-xs font-bold ">No users found</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards Layout */}
            <div className="grid grid-cols-1 gap-2 md:hidden">
              {users.map((user) => (
                <div key={user._id} className="bg-background border border-border p-3 flex flex-col gap-3 relative">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-sm font-black text-background shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="font-bold text-[13px] uppercase truncate">{user.name || 'N/A'}</h3>
                      <p className="text-[10px] text-muted-foreground truncate font-medium">{user.email}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{user.phone || 'No phone'}</p>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {user.isBlocked ? (
                        <span className="inline-flex px-1.5 py-0.5 border border-red-500 text-[8px] font-black tracking-widest bg-red-500/5 text-red-500 items-center gap-1">
                          <Ban size={8} /> BLKD
                        </span>
                      ) : (
                        <span className="inline-flex px-1.5 py-0.5 border border-emerald-500 text-[8px] font-black tracking-widest bg-emerald-500/5 text-emerald-500 items-center gap-1">
                          <CheckCircle2 size={8} /> ACTV
                        </span>
                      )}
                      <span className={`inline-block px-1.5 py-0.5 border text-[8px] font-black tracking-widest ${
                        user.role === 'superadmin' ? 'border-purple-500 text-purple-500 bg-purple-500/5' :
                        user.role === 'admin' ? 'border-blue-500 text-blue-500 bg-blue-500/5' :
                        'border-muted-foreground text-muted-foreground bg-muted/30'
                      }`}>{user.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                    <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">
                      {user.createdAt ? formatDate(user.createdAt) : '-'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openUserDetail(user._id)} className="p-1.5 border border-border bg-muted/30 text-muted-foreground hover:text-foreground">
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => toggleBlock(user._id, user.isBlocked)}
                        disabled={toggling === user._id}
                        className={`px-2 py-1 border text-[9px] font-bold tracking-widest flex items-center gap-1 ${
                          user.isBlocked
                            ? 'border-emerald-500 text-emerald-500'
                            : 'border-red-500 text-red-500'
                        } disabled:opacity-50`}
                      >
                        {toggling === user._id ? <Loader2 size={10} className="animate-spin" /> : user.isBlocked ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                        {user.isBlocked ? 'UNBLOCK' : 'BLOCK'}
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
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Phone</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Joined</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-bold text-foreground uppercase ">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-2 font-black flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-xs font-black text-background">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {user.name || 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground font-medium">{user.email}</td>
                      <td className="py-3 px-2 text-muted-foreground">{user.phone || '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-1 border text-[9px] font-black tracking-widest ${
                          user.role === 'superadmin' ? 'border-purple-500 text-purple-500 bg-purple-500/5' :
                          user.role === 'admin' ? 'border-blue-500 text-blue-500 bg-blue-500/5' :
                          'border-muted-foreground text-muted-foreground bg-muted/30'
                        }`}>{user.role}</span>
                      </td>
                      <td className="py-3 px-2">
                        {user.isBlocked ? (
                          <span className="inline-flex px-2 py-1 border border-red-500 text-[9px] font-black tracking-widest bg-red-500/5 text-red-500 items-center w-max gap-1">
                            <Ban size={10} /> BLOCKED
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 border border-emerald-500 text-[9px] font-black tracking-widest bg-emerald-500/5 text-emerald-500 items-center w-max gap-1">
                            <CheckCircle2 size={10} /> ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-[10px] text-muted-foreground">{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openUserDetail(user._id)} className="p-2 border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-colors">
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => toggleBlock(user._id, user.isBlocked)}
                            disabled={toggling === user._id}
                            className={`px-3 py-1.5 border-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                              user.isBlocked
                                ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                            } disabled:opacity-50`}
                          >
                            {toggling === user._id ? <Loader2 size={12} className="animate-spin" /> : user.isBlocked ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                            {user.isBlocked ? 'UNBLOCK' : 'BLOCK'}
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground">PAGE {pagination.page} OF {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-border hover:border-foreground hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={18} /></button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-border hover:border-foreground hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {(viewUser || viewLoading) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4" onClick={() => setViewUser(null)}>
          <div className="border border-border bg-background rounded-xl p-4 md:p-6 lg:p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            {viewLoading ? (
              <LoadingSpinnerIphone />
            ) : viewUser ? (
              <>
                <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-border pb-3 md:pb-4">
                  <h3 className="text-lg md:text-2xl font-bold tracking-tighter text-foreground">USER DETAILS</h3>
                  <button onClick={() => setViewUser(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} className="md:w-5 md:h-5" /></button>
                </div>
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center text-2xl font-black text-background">
                    {viewUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base md:text-lg font-black text-foreground uppercase truncate">{viewUser.name}</h4>
                    <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 md:mt-1 truncate">{viewUser.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    ['PHONE', viewUser.phone || '-'],
                    ['ROLE', viewUser.role],
                    ['ORDERS', viewUser.orderCount ?? '-'],
                    ['STATUS', viewUser.isBlocked ? 'BLOCKED' : 'ACTIVE'],
                    ['JOINED', viewUser.createdAt ? formatDate(viewUser.createdAt) : '-'],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between items-center border-b border-border/10 pb-2">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <span className="text-xs font-bold text-foreground uppercase ">{value as string}</span>
                    </div>
                  ))}
                  {viewUser.address && (
                    <div className="pt-1 md:pt-2">
                      <span className="text-[10px] md:text-xs font-medium text-muted-foreground block mb-1 md:mb-2">ADDRESS</span>
                      <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest p-2 md:p-4 border border-border">
                        {[viewUser.address.village, viewUser.address.upazila, viewUser.address.zila, viewUser.address.division].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
