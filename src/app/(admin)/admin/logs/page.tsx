"use client";

import React, { useEffect, useState, useCallback } from "react";
import LoadingSpinnerIphone from "@/components/shared/loadingSpinerIphone";
import { Activity, Clock, ChevronLeft, ChevronRight, Users, Eye, TrendingUp, Package, Link2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/20 text-emerald-400",
  update: "bg-blue-500/20 text-blue-400",
  delete: "bg-red-500/20 text-red-400",
  login: "bg-purple-500/20 text-purple-400",
  logout: "bg-gray-500/20 text-gray-400",
  block: "bg-red-500/20 text-red-400",
  unblock: "bg-emerald-500/20 text-emerald-400",
  payment: "bg-amber-500/20 text-amber-400",
  ship: "bg-teal-500/20 text-teal-400",
  deliver: "bg-emerald-500/20 text-emerald-400",
};

export default function AdminLogsAnalyticsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogsAndAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [logsRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/logs?page=${page}&limit=15`),
        fetch(`/api/admin/analytics`)
      ]);
      
      const logsData = await logsRes.json();
      const analyticsData = await analyticsRes.json();
      
      if (logsData.success) {
        setLogs(logsData.data);
        setPagination(logsData.pagination);
      }
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogsAndAnalytics(); }, [fetchLogsAndAnalytics]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const toggleExpand = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  if (loading) {
    return <div className="py-20 max-w-sm mx-auto"><LoadingSpinnerIphone /></div>;
  }

  return (
    <div className="space-y-4 md:space-y-8 pb-6 md:pb-10">
      <div className="border-b border-border pb-3 md:pb-0 md:border-0">
        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-foreground mb-1 md:mb-2 leading-none">Analytics & Logs</h1>
        <p className="text-[10px] md:text-sm font-semibold tracking-widest text-muted-foreground uppercase">Monitor traffic & system actions.</p>
      </div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-6">
          <div className="bg-background border border-border shadow-sm p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
            <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Now</p>
              <h3 className="text-xl md:text-4xl font-black text-foreground mt-0.5 md:mt-1 flex items-center gap-2">
                {analytics.activeNow}
                <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-green-500"></span>
                </span>
              </h3>
            </div>
          </div>
          
          <div className="bg-background border border-border shadow-sm p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
            <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 md:w-8 md:h-8 text-purple-500" />
            </div>
            <div>
              <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Visits Today</p>
              <h3 className="text-xl md:text-4xl font-black text-foreground mt-0.5 md:mt-1">{analytics.visitsToday}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Top Routes & Products */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Top Routes */}
          <div className="bg-background border-0 border-t border-b md:border border-border rounded-none md:rounded-2xl p-4 md:p-6 -mx-4 md:mx-0 shadow-none md:shadow-sm">
            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-3 md:mb-6 border-b border-border pb-2 md:pb-4">
              <Link2 size={14} className="md:w-4 md:h-4" /> Top Routes
            </h3>
            <div className="space-y-3 md:space-y-4">
              {analytics.topRoutes.length > 0 ? analytics.topRoutes.map((route: any, idx: number) => (
                <div key={route._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <span className="text-muted-foreground font-bold text-[10px] md:text-xs">{idx + 1}.</span>
                    <span className="font-medium text-[10px] md:text-sm truncate max-w-[150px] sm:max-w-xs">{route._id}</span>
                  </div>
                  <span className="px-2 md:px-3 py-0.5 md:py-1 bg-muted rounded-full text-[9px] md:text-xs font-bold shrink-0 uppercase tracking-widest">{route.views} views</span>
                </div>
              )) : (
                <p className="text-[10px] md:text-sm text-muted-foreground">No visits recorded yet.</p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-background border-0 border-t border-b md:border border-border rounded-none md:rounded-2xl p-4 md:p-6 -mx-4 md:mx-0 shadow-none md:shadow-sm">
            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-3 md:mb-6 border-b border-border pb-2 md:pb-4">
              <TrendingUp size={14} className="md:w-4 md:h-4" /> Top Products
            </h3>
            <div className="space-y-3 md:space-y-4">
              {analytics.topProducts.length > 0 ? analytics.topProducts.map((prod: any, idx: number) => (
                <div key={prod._id} className="flex items-center justify-between gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <span className="text-muted-foreground font-bold text-[10px] md:text-xs shrink-0">{idx + 1}.</span>
                    {prod.image ? (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden shrink-0 bg-muted">
                        <Image src={prod.image} alt={prod.name} width={40} height={40} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded shrink-0 bg-muted flex items-center justify-center"><Package size={14} className="md:w-4 md:h-4" /></div>
                    )}
                    <span className="font-bold text-[10px] md:text-sm truncate max-w-[120px] sm:max-w-xs">{prod.name}</span>
                  </div>
                  <span className="px-2 md:px-3 py-0.5 md:py-1 bg-muted rounded-full text-[9px] md:text-xs font-bold shrink-0 uppercase tracking-widest">{prod.views} views</span>
                </div>
              )) : (
                <p className="text-[10px] md:text-sm text-muted-foreground">No product visits recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Logs */}
      <div className="bg-background border-0 border-t md:border border-border rounded-none md:rounded-2xl p-0 md:p-6 shadow-none md:shadow-sm -mx-4 md:mx-0">
        <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-0 md:mb-6 p-4 md:p-0 border-b border-border md:pb-4">
          <Activity size={14} className="md:w-4 md:h-4" /> System Logs {pagination && `(${pagination.total})`}
        </h3>
        
        {logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Activity size={32} className="mx-auto mb-4 opacity-30" />
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest">No activity logs yet</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col divide-y divide-border">
              {logs.map((log: any) => (
                <div key={log._id} className="p-3 bg-background flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold tracking-widest uppercase">
                      <Clock size={10} className="text-blue-500" />
                      {formatDate(log.createdAt)}
                    </div>
                    <span className={`px-1.5 py-0.5 border text-[8px] uppercase tracking-widest font-black ${ACTION_COLORS[log.action] || "border-muted-foreground text-muted-foreground"}`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-foreground truncate max-w-[180px]">{log.user?.name || log.user?.email || "System"}</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{log.entityType || "-"}</p>
                    </div>
                    <button 
                      onClick={() => toggleExpand(log._id)}
                      className="p-1.5 border border-border bg-muted/30 text-foreground rounded-sm"
                    >
                      {expandedLog === log._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                  {expandedLog === log._id && (
                    <div className="mt-2 bg-black text-green-400 p-2 border border-border/50 text-[9px] font-mono overflow-x-auto whitespace-pre-wrap">
                      {(() => {
                        try {
                          const parsed = JSON.parse(log.details);
                          return JSON.stringify(parsed, null, 2);
                        } catch (e) {
                          return log.details;
                        }
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b-2 border-border text-muted-foreground text-xs uppercase tracking-widest">
                    <th className="pb-3 font-bold">Date & Time</th>
                    <th className="pb-3 font-bold">User</th>
                    <th className="pb-3 font-bold">Action</th>
                    <th className="pb-3 font-bold">Entity</th>
                    <th className="pb-3 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log: any) => (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-muted/20 transition-colors group">
                        <td className="py-4 text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-2 font-medium">
                            <Clock size={12} className="text-blue-500" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="py-4 text-sm font-bold text-foreground">
                          {log.user?.name || log.user?.email || "System"}
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-black ${ACTION_COLORS[log.action] || "bg-muted text-foreground"}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 text-foreground text-sm font-semibold capitalize">{log.entityType || "-"}</td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => toggleExpand(log._id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold transition-colors"
                          >
                            {expandedLog === log._id ? (
                              <><ChevronUp size={14} /> Hide</>
                            ) : (
                              <><ChevronDown size={14} /> View Data</>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log._id && (
                        <tr className="bg-muted/10">
                          <td colSpan={5} className="p-4 border-b border-border">
                            <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                              {(() => {
                                try {
                                  const parsed = JSON.parse(log.details);
                                  return JSON.stringify(parsed, null, 2);
                                } catch (e) {
                                  return log.details;
                                }
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 md:p-0 md:pt-6 border-t border-border md:mt-4 bg-background">
            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 md:p-2 rounded-sm md:rounded-lg border border-border bg-background hover:bg-muted text-foreground disabled:opacity-30 transition-colors"><ChevronLeft size={14} className="md:w-4 md:h-4" /></button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 md:p-2 rounded-sm md:rounded-lg border border-border bg-background hover:bg-muted text-foreground disabled:opacity-30 transition-colors"><ChevronRight size={14} className="md:w-4 md:h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
