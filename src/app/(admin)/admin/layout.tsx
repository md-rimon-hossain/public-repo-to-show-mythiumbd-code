"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Package,
  Tags, 
  ShoppingCart, 
  Users, 
  UserCog, 
  Link as LinkIcon, 
  Images, 
  Ticket, 
  Mail, 
  Activity,
  Menu,
  X,
  LogOut,
  MessageSquare,
  Settings,
  Gift
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'All Products', href: '/admin/products', icon: Package },
  { name: 'Create Product', href: '/admin/products/create', icon: PackagePlus },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Support', href: '/admin/support', icon: MessageSquare },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Admins', href: '/admin/admins', icon: UserCog },
  { name: 'Hero Slides', href: '/admin/hero-slides', icon: Images },
  { name: 'SIGNATURE PICKS', href: '/admin/signature-picks', icon: Gift },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { name: 'Logs', href: '/admin/logs', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Find the most specific active link (longest matching href)
  const activeLink = sidebarLinks.slice().sort((a, b) => b.href.length - a.href.length).find(link => pathname === link.href || pathname.startsWith(link.href + '/'))?.href;

  // Basic role check
  if (status === 'loading') return <LoadingSpinnerIphone/>
  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'superadmin') {
    if (typeof window !== 'undefined') router.push('/');
    return <div className="min-h-screen flex items-center justify-center p-4"><div className="glass-card p-8 text-center text-red-500">Access Denied. Admins only.</div></div>;
  }

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-border">
          <h1 className="text-xl font-black uppercase tracking-tighter text-foreground">
            Mythium Admin
          </h1>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setIsMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/admin' ? pathname === link.href : link.href === activeLink;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 border ${
                  isActive 
                    ? 'bg-foreground text-background border-foreground font-bold' 
                    : 'text-muted-foreground border-transparent hover:border-border hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Icon size={18} />
                <span className="font-semibold tracking-wide text-[14px]">{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 mt-auto border-t border-border">
          <div className="border border-border bg-background p-4 rounded-xl flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-foreground truncate">{session?.user?.name || 'Admin'}</span>
              <span className="text-[10px] font-medium text-muted-foreground capitalize truncate">{(session?.user as any)?.role || 'Admin'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => signOut()} 
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="lg:hidden p-4 bg-background border-b border-border flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="text-foreground hover:opacity-70 transition-opacity">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black uppercase tracking-tighter text-foreground">Mythium Admin</h2>
          </div>
          <ThemeToggle />
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
}
