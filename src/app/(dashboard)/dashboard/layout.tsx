"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  LogOut,
  MapPin,
  Settings
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Header } from '@/components/storefront/header';
import { CartSidebar } from '@/components/storefront/cart-sidebar';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';

const sidebarLinks = [
  { name: 'My Profile', href: '/dashboard', icon: User },
  { name: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
  { name: 'Address Book', href: '/dashboard/addresses', icon: MapPin },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (status === 'loading') return <LoadingSpinnerIphone/>;
  
  // Need to handle auth redirection properly in middleware, but just in case:
  if (status === 'unauthenticated') {
    return <div className="min-h-screen flex items-center justify-center p-4">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header fixed at the top of the flex container */}
      <div className="flex-shrink-0 z-50">
        <Header />
      </div>

      {/* Split pane below header */}
      <div className="flex flex-1 overflow-hidden w-full max-w-[1600px] mx-auto">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex flex-col w-72 h-full flex-shrink-0 bg-background border-r border-border/50 z-20 overflow-y-auto">
        <div className="p-8 flex flex-col min-h-full">
          <div className="flex items-center gap-4 mb-10 pb-8 border-b-2 border-border">
            <div className="w-14 h-14 flex-shrink-0 rounded-full border-2 border-foreground bg-muted overflow-hidden relative">
              <Image 
                src={session?.user?.image || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-black uppercase tracking-widest text-foreground text-[11px] truncate">{session?.user?.name || 'Mythium User'}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold tracking-wider truncate mt-1">{session?.user?.email}</p>
            </div>
          </div>

          <nav className="space-y-3 flex-1 flex flex-col">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.href === '/dashboard' ? pathname === link.href : (pathname === link.href || pathname.startsWith(link.href + '/'));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border-2 ${
                    isActive 
                      ? 'bg-foreground text-background border-foreground shadow-md translate-x-1' 
                      : 'bg-transparent text-foreground/70 border-transparent hover:border-border hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-background" : "group-hover:text-foreground"} />
                  <span className={`font-black uppercase tracking-widest text-[10px] sm:text-xs ${isActive ? 'text-background' : ''}`}>{link.name}</span>
                </Link>
              );
            })}
            
            <div className="mt-auto pt-6 border-t-2 border-border">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 bg-transparent text-red-500 border-2 border-transparent hover:border-red-500 hover:bg-red-500 hover:text-white w-full"
              >
                <LogOut size={18} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs">Log Out</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full bg-background relative">
        <div className="w-full min-h-full bg-background p-4 md:p-6 lg:p-8 pb-[120px] md:pb-6 lg:pb-8">
          {children}
        </div>
      </main>
      </div>
      <CartSidebar />
    </div>
  );
}
