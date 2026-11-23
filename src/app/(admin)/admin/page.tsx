"use client";

import React, { useEffect, useState, useCallback } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { 
  ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';
import { TrendingUp, Users, ShoppingBag, AlertTriangle, Package, Truck, CheckCircle, XCircle, Clock, Truck as TruckIcon, Calendar } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const STATUS_COLORS: Record<string, string> = {
  delivered: '#10b981',
  processing: '#3b82f6',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  confirmed: '#8b5cf6',
  shipped: '#14b8a6',
  out_for_delivery: '#ec4899',
  returned: '#f97316',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/admin/stats?timeframe=${timeframe}`;
      if (timeframe === 'custom' && customStart && customEnd) {
        url += `&start=${customStart}&end=${customEnd}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to load stats');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [timeframe, customStart, customEnd]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="py-20 max-w-sm mx-auto">
        <LoadingSpinnerIphone />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="border border-border bg-background rounded-xl p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-bold text-foreground mb-2">Failed to Load Dashboard</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button onClick={fetchStats} className="px-6 py-2 border border-border rounded-lg font-bold text-sm hover:bg-foreground hover:text-background transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const orderStatusData = (stats?.ordersByStatus || []).map((s: any) => ({
    name: s._id?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Unknown',
    value: s.count,
  }));

  const orderStatusColors = (stats?.ordersByStatus || []).map((s: any) => STATUS_COLORS[s._id] || '#6b7280');

  const StatCard = ({ title, value, count, icon: Icon, colorClass, subtitle }: any) => (
    <div className="border border-border bg-background rounded-xl p-3 md:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-foreground/30 transition-colors">
      <div className="flex items-start justify-between w-full mb-1.5 md:mb-2">
        <div className="pr-2">
          <p className="text-muted-foreground text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight">{title}</p>
          {subtitle && <p className="text-[8px] md:text-[9px] text-muted-foreground opacity-70 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
        <div className={`p-1.5 rounded-lg bg-background border border-border shrink-0 ${colorClass}`}>
          <Icon size={14} className="md:w-[16px] md:h-[16px]" />
        </div>
      </div>
      <div>
        <div className="flex items-end justify-between flex-wrap gap-1 mt-1">
          <h3 className="text-lg md:text-xl font-black text-foreground tracking-tighter leading-none">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {count != null && (
            <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 whitespace-nowrap">
              {count} {count === 1 ? 'Order' : 'Orders'}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 pb-12 relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-border pb-6 gap-4 relative z-20">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tighter leading-none mb-2">Analytics</h1>
          <p className="text-muted-foreground mt-2 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold">Real-time store performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center p-1 bg-muted/30 border border-border rounded-lg overflow-visible max-w-full w-full sm:w-auto relative">
            {['today', 'week', 'month', 'lifetime'].map((t) => (
              <button
                key={t}
                onClick={() => { setTimeframe(t); setShowDatePicker(false); }}
                className={`px-1.5 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-[8px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-[0.15em] rounded-md transition-all whitespace-nowrap flex-1 md:flex-none ${
                  timeframe === t 
                    ? 'bg-foreground text-background shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : t}
              </button>
            ))}
            
            <div className="relative ml-0.5 md:ml-1">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 rounded-md transition-all flex items-center justify-center ${
                  timeframe === 'custom' || showDatePicker
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title="Custom Date Range"
              >
                <Calendar size={14} className="md:w-4 md:h-4" />
              </button>

              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 p-4 bg-background border border-border rounded-xl shadow-xl z-50 w-72 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Start Date</label>
                    <input 
                      type="date" 
                      value={customStart} 
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)} 
                      className="bg-muted/30 border border-border rounded-md text-sm font-bold text-foreground outline-none px-3 py-2 w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">End Date</label>
                    <input 
                      type="date" 
                      value={customEnd} 
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)} 
                      className="bg-muted/30 border border-border rounded-md text-sm font-bold text-foreground outline-none px-3 py-2 w-full"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (customStart && customEnd) {
                        setTimeframe('custom');
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={!customStart || !customEnd}
                    className="w-full bg-foreground text-background font-bold py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    Apply Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && stats && (
        <div className="absolute top-0 right-0 p-2 z-50">
          <div className="animate-spin w-5 h-5 border-2 border-foreground border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Timeframe Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 mb-2">
        <StatCard title="Total Sales" subtitle="Delivered orders only" value={formatPrice(stats?.salesMetrics?.totalSales || 0)} count={stats?.salesMetrics?.totalSalesCount ?? 0} icon={TrendingUp} colorClass="text-emerald-500" />
        <StatCard title="Canceled" subtitle="Canceled before shipping" value={formatPrice(stats?.salesMetrics?.canceledSales || 0)} count={stats?.salesMetrics?.canceledSalesCount ?? 0} icon={XCircle} colorClass="text-red-500" />
        <StatCard title="Returned" subtitle="Returned after shipping" value={formatPrice(stats?.salesMetrics?.returnedSales || 0)} count={stats?.salesMetrics?.returnedSalesCount ?? 0} icon={AlertTriangle} colorClass="text-orange-500" />
      </div>

      {/* Live Pipeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-8 mb-4 relative z-10 pl-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-foreground">Live Pipeline</h2>
        </div>
        <div className="hidden sm:block w-px h-4 bg-border mx-2"></div>
        <span className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest sm:bg-muted/30 sm:px-3 sm:py-1 rounded-md border border-transparent sm:border-border/50">
          What is going on with your sales right now
        </span>
      </div>

      {/* Live Pipeline Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-3 mb-8">
        <StatCard title="In Review" value={formatPrice(stats?.salesMetrics?.pendingSales || 0)} count={stats?.salesMetrics?.pendingSalesCount ?? 0} icon={Clock} colorClass="text-amber-500" />
        <StatCard title="Confirmed" value={formatPrice(stats?.salesMetrics?.confirmedSales || 0)} count={stats?.salesMetrics?.confirmedSalesCount ?? 0} icon={CheckCircle} colorClass="text-purple-500" />
        <StatCard title="Processing" value={formatPrice(stats?.salesMetrics?.processingSales || 0)} count={stats?.salesMetrics?.processingSalesCount ?? 0} icon={Package} colorClass="text-blue-500" />
        <StatCard title="Shipped" value={formatPrice(stats?.salesMetrics?.shippedSales || 0)} count={stats?.salesMetrics?.shippedSalesCount ?? 0} icon={TruckIcon} colorClass="text-teal-500" />
        <StatCard title="Out for Delivery" value={formatPrice(stats?.salesMetrics?.outForDeliverySales || 0)} count={stats?.salesMetrics?.outForDeliverySalesCount ?? 0} icon={Truck} colorClass="text-pink-500" />
      </div>

      {/* General Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <div className="border border-border bg-background rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <Users size={20} className="text-muted-foreground mb-2" />
          <p className="text-xl font-black">{stats?.totalUsers || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Total Users</p>
        </div>
        <div className="border border-border bg-background rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <ShoppingBag size={20} className="text-muted-foreground mb-2" />
          <p className="text-xl font-black">{stats?.totalOrders || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Orders in Period</p>
        </div>
        <div className="border border-border bg-background rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <Package size={20} className="text-muted-foreground mb-2" />
          <p className="text-xl font-black">{stats?.totalProducts || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Total Products</p>
        </div>
        <div className="border border-border bg-background rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <Truck size={20} className="text-muted-foreground mb-2" />
          <p className="text-xl font-black">{formatPrice(stats?.steadfastBalance?.current_balance || 0)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Courier Balance</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="border border-border bg-background rounded-xl p-6 xl:col-span-2 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-6 border-b border-border pb-4 uppercase tracking-widest">Revenue Trend ({timeframe})</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats?.graphData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" stroke="currentColor" strokeOpacity={0.5} tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis 
                  yAxisId="left" 
                  stroke="currentColor" 
                  strokeOpacity={0.5} 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `৳${value}`} 
                  domain={[0, (dataMax: number) => Math.max(dataMax, 5000)]}
                  label={{ value: 'Revenue (৳)', angle: -90, position: 'insideLeft', fill: 'currentColor', opacity: 0.5, style: { textAnchor: 'middle', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' } }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#ec4899" 
                  strokeOpacity={0.5} 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                  label={{ value: 'Sales Count', angle: 90, position: 'insideRight', fill: '#ec4899', opacity: 0.8, style: { textAnchor: 'middle', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' } }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'sales') return [formatPrice(value), 'Revenue'];
                    return [value, 'Sales'];
                  }}
                />
                <Bar yAxisId="left" dataKey="sales" fill="url(#colorSales)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899', stroke: 'var(--background)' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-background rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-6 border-b border-border pb-4 uppercase tracking-widest">Order Status Breakdown</h3>
          <div className="h-[350px] w-full flex flex-col">
            {orderStatusData.length > 0 ? (
              <>
                <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {orderStatusData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={orderStatusColors[index] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontWeight: 'bold' }} 
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
                  {orderStatusData.map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: orderStatusColors[index] || COLORS[index % COLORS.length] }}></span>
                        <span className="truncate text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground font-medium text-sm">No order data in this period</div>
            )}
          </div>
        </div>
      </div>

      {/* Product Analytics & Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="border border-border bg-background rounded-xl p-0 xl:col-span-2 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border bg-background/50">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Product Analytics</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Top performers in selected timeframe</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/30 text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold">Product</th>
                  <th className="px-6 py-4 font-bold text-center">Delivered</th>
                  <th className="px-6 py-4 font-bold text-center">Canceled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {(stats?.topProducts || []).length > 0 ? (
                  stats?.topProducts.map((product: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 flex items-center gap-4">
                        {product.image && (
                          <div className="w-10 h-10 rounded-md overflow-hidden relative border border-border flex-shrink-0 bg-muted">
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          </div>
                        )}
                        <Link target="_blank" rel="noopener noreferrer" href={product.slug ? `/products/${product.slug}` : '#'} className="font-bold text-foreground max-w-[150px] sm:max-w-[250px] md:max-w-[350px] truncate hover:underline hover:text-blue-500 transition-colors">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{product.deliveredCount}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full">{product.canceledCount}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium">
                      No product sales data in this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-border bg-background rounded-xl p-6 shadow-sm flex flex-col h-full max-h-[500px]">
          <h3 className="text-sm font-bold text-foreground mb-6 border-b border-border pb-4 uppercase tracking-widest">Low Stock Alerts</h3>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {(stats?.lowStockProducts || []).length > 0 ? (
              stats?.lowStockProducts.map((product: any) => (
                <div key={product._id} className="flex items-center justify-between p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full border border-red-500 text-red-500 flex items-center justify-center flex-shrink-0 bg-background">
                      <AlertTriangle size={14} strokeWidth={2.5} />
                    </div>
                    <div className="truncate">
                      <Link target="_blank" rel="noopener noreferrer" href={product.slug ? `/products/${product.slug}` : '#'} className="font-bold text-xs text-foreground truncate hover:underline hover:text-blue-500 transition-colors">
                        {product.title}
                      </Link>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="block text-red-500 font-black text-xs">{product.totalQuantity} left</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Package size={24} />
                </div>
                <span className="font-medium text-sm">Inventory is healthy!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
