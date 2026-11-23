"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import mythiumLogo from "@/assets/final_black_logo.svg";
import whiteLogo from "@/assets/final_white_logo.svg";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  ShoppingBag,
  Settings,
  MapPin,
  LogOut,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Facebook,
  Instagram,
  Home,
  LayoutGrid,
  Store,
  HelpCircle,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useSession } from "next-auth/react";
import { GlassButton } from "@/components/ui/glass-button";
import { openCart } from "@/store/slices/cartSlice";
import { motion, AnimatePresence } from "framer-motion";
import { SearchOverlay } from "./search-overlay";

interface NavLink {
  id?: string;
  _id?: string;
  label: string;
  href: string;
  parentId?: string;
}

// Simple inline TikTok icon since lucide-react doesn't ship one
function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82c-.9-.98-1.39-2.26-1.38-3.57h-3.05v13.6c0 1.5-1.22 2.72-2.72 2.72a2.72 2.72 0 0 1 0-5.44c.28 0 .55.04.8.12V9.9a5.8 5.8 0 0 0-.8-.06 5.77 5.77 0 1 0 5.77 5.77V8.86a8.6 8.6 0 0 0 5.03 1.6V7.4a5.6 5.6 0 0 1-3.65-1.58z" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isCheckout = pathname === "/checkout";

  const [links, setLinks] = useState<NavLink[]>([]);
  const [fetchedCategories, setFetchedCategories] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [desktopCollectionsOpen, setDesktopCollectionsOpen] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const cartCount = useSelector((state: RootState) => state.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
  const wishlistCount = useSelector((state: RootState) => state.wishlist?.items?.length || 0);

  useEffect(() => {
    // Fetch top-level header links
    fetch("/api/header-links?active=true")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLinks(json.data);
        } else {
          throw new Error("Database empty, using fallback");
        }
      })
      .catch(() => {
        setLinks([
          { id: "home", label: "Home", href: "/" },
          { id: "shop-all", label: "Shop All", href: "/products" },
          { id: "collections", label: "Collections", href: "/collections" },
        ]);
      });

    // Fetch actual product categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setFetchedCategories(json.data.filter((cat: any) => cat.isActive));
        }
      })
      .catch((err) => console.error("Failed to fetch categories:", err));

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 100); // 100px threshold for safe native scrolling out of view

      if (currentScrollY > lastScrollY) {
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection("up");
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the dropdown on outside click (not just mouse-leave, since it's click-driven now)
  useEffect(() => {
    if (!desktopCollectionsOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownWrapperRef.current && !dropdownWrapperRef.current.contains(e.target as Node)) {
        setDesktopCollectionsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopCollectionsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [desktopCollectionsOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen || mobileProfileOpen || searchOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [mobileMenuOpen, mobileProfileOpen, searchOpen]);

  // Top-level nav items (no parent)
  const topLinks = links.filter((l) => !l.parentId);

  // Find the 'Collections' link to know when to render the dropdown
  const collectionsParent = topLinks.find(
    (l) => l.label?.toLowerCase() === "collections"
  );

  // Use fetched actual categories for the dropdown, fallback to header-links children
  const categories: NavLink[] =
    fetchedCategories.length > 0
      ? fetchedCategories.map((cat) => ({
          id: cat._id,
          _id: cat._id,
          label: cat.name,
          href: `/products?category=${cat._id}`,
        }))
      : links.filter(
          (l) => collectionsParent && l.parentId === (collectionsParent._id || collectionsParent.id)
        );

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileProfileOpen(false);
    setSearchOpen(false);
  };

  const isMenuOpen = mobileMenuOpen || mobileProfileOpen || searchOpen;

  const headerClasses = isDashboard
    ? "w-full z-50 bg-background dark:bg-black relative py-2 lg:py-3 border-b border-neutral-200 dark:border-neutral-800"
    : `w-full z-50 bg-background dark:bg-black ${
        !isScrolled && !isMenuOpen
          ? "relative py-2 lg:py-3" // Native scroll out of view
          : `${isMenuOpen ? "fixed" : "sticky"} top-0 py-2 shadow-md ${
              scrollDirection === "down" && !isMenuOpen
                ? "-translate-y-full" // hide instantly
                : `translate-y-0 ${isMenuOpen ? "" : "transition-transform duration-500 ease-out"}` // smoothly slide down unless menu is opening
            }`
      }`;

  return (
    <>
      <header className={headerClasses}>
        {/* Primary row */}
        <div className="container mx-auto px-1 md:px-6">
          <div className="grid grid-cols-3 items-center">
            {/* Left: hamburger (mobile) + search */}
            <div className="flex items-center gap-2">
              <GlassButton
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setMobileProfileOpen(false);
                }}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </GlassButton>
              <GlassButton size="icon" variant="ghost" onClick={() => setSearchOpen(true)} className="hidden md:flex">
                <Search className="h-5 w-5" />
              </GlassButton>
            </div>

            {/* Center: Logo */}
            <div className="flex justify-center items-center gap-4 md:gap-6">
              <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
                <Image
                  src={mythiumLogo}
                  alt="Mythium"
                  className="h-12 md:h-14 w-auto dark:hidden"
                  priority
                />
                <Image
                  src={whiteLogo}
                  alt="Mythium"
                  className="h-12 md:h-14 w-auto hidden dark:block"
                  priority
                />
              </Link>
              
              {isDashboard && (
                <>
                  <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
                  <Link 
                    href="/" 
                    className="hidden sm:flex items-center gap-2 text-[10px] md:text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Continue Shopping
                  </Link>
                </>
              )}
            </div>

            {/* Right: Wishlist, Cart, Profile */}
            <div className="flex items-center justify-end gap-2 md:gap-3">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              <Link href="/dashboard/wishlist" onClick={closeMobileMenu} className="hidden sm:block">
                <GlassButton size="icon" variant="ghost" className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black dark:bg-white text-[10px] font-semibold text-white dark:text-black">
                      {wishlistCount}
                    </span>
                  )}
                </GlassButton>
              </Link>

              <button 
                onClick={() => {
                  closeMobileMenu();
                  if (pathname !== "/cart") {
                    dispatch(openCart());
                  }
                }} 
                className="hidden md:block"
                aria-label="Open Cart"
              >
                <GlassButton size="icon" variant="ghost" className="relative pointer-events-none">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black dark:bg-white text-[10px] font-semibold text-white dark:text-black">
                      {cartCount}
                    </span>
                  )}
                </GlassButton>
              </button>

              {/* Mobile Search (Right side) */}
              <div className="md:hidden flex items-center">
                <GlassButton size="icon" variant="ghost" onClick={() => setSearchOpen(true)}>
                  <Search className="h-5 w-5" />
                </GlassButton>
              </div>
              <div className="hidden md:block">
                {status === "loading" ? (
                  <GlassButton size="icon" variant="ghost"><div className="w-5 h-5 rounded-full animate-pulse bg-foreground/20" /></GlassButton>
                ) : session?.user ? (
                  <Link href="/dashboard" onClick={closeMobileMenu} className="w-9 h-9 rounded-full overflow-hidden border border-foreground/20 block hover:ring-2 hover:ring-foreground/20 transition-all ml-2">
                    <Image src={session.user.image || 'https://via.placeholder.com/150'} alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
                  </Link>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu} className="text-xs font-bold uppercase tracking-widest px-5 py-2 border border-foreground/20 rounded-full hover:bg-foreground hover:text-background transition-colors ml-2">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary row: Home / Shop All / Collections (desktop only) */}
        {!isDashboard && !isCheckout && (
          <div ref={dropdownWrapperRef} className="hidden lg:block  mt-4">
          <div className="container mx-auto px-1 md:px-6">
            <nav className="flex items-center justify-center gap-8 py-1 relative">
              {topLinks.map((link) => {
                const isCollections = link.label?.toLowerCase() === "collections";
                if (isCollections) {
                  return (
                    <button
                      key={link._id || link.id}
                      type="button"
                      aria-expanded={desktopCollectionsOpen}
                      className="flex items-center gap-1 text-sm font-bold tracking-wide uppercase hover:text-black dark:hover:text-white transition-colors"
                      onClick={() => setDesktopCollectionsOpen((v) => !v)}
                    >
                      {link.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          desktopCollectionsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  );
                }
                return (
                  <Link
                    key={link._id || link.id}
                    href={link.href}
                    onClick={() => setDesktopCollectionsOpen(false)}
                    className="text-sm font-bold tracking-wide uppercase hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                );
              })}

              
            </nav>
          </div>
          {/* Mega dropdown panel */}
              <AnimatePresence>
                {desktopCollectionsOpen && categories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-0 right-0 glass-nav border-t border-neutral-200 dark:border-neutral-800 shadow-lg"
                  >
                    <div className="container mx-auto px-1 md:px-6 py-8">
                      <div className="flex flex-col gap-4 max-w-xs">
                        {categories.map((cat) => (
                          <Link
                            key={cat._id || cat.id}
                            href={cat.href}
                            className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                            onClick={() => setDesktopCollectionsOpen(false)}
                          >
                            {cat.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        )}

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 w-full h-screen bg-black/40 backdrop-blur-sm"
                onClick={closeMobileMenu}
              />
              
              {/* Menu Panel */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full left-0 w-full h-[calc(100dvh-4rem-60px)] glass-sidebar bg-white dark:bg-black flex flex-col overflow-hidden border-t border-neutral-200 dark:border-neutral-800"
              >
                {/* Single Flat Menu */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-20 flex flex-col gap-0.5">
                  {topLinks.map((link) => {
                    if (link.label?.toLowerCase() === "home") return null;

                    const isCollections = link.label?.toLowerCase() === "collections";
                    
                    if (isCollections) {
                      return (
                          <div key={link._id || link.id} className="px-3 pb-2 mt-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">
                              {link.label}
                            </h3>
                            <div className="flex flex-col gap-0.5 border-l-2 dark:border-neutral-800 ml-1">
                              {categories.map((cat) => (
                                <Link
                                  key={cat._id || cat.id}
                                  href={cat.href}
                                  onClick={closeMobileMenu}
                                  className="py-2.5 px-2.5 rounded-md text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                >
                                  {cat.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                      );
                    }
                    
                    return (
                      <Link
                        key={link._id || link.id}
                        href={link.href}
                        onClick={closeMobileMenu}
                        className="py-2.5 px-3 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <ThemeToggle />
                    {!session && (
                      <Link
                        href="/login"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 text-sm font-medium hover:text-black dark:hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Log in
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <a href="https://www.facebook.com/mythiumbd" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="group flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] transition-all duration-300 hover:shadow-[0_0_15px_rgba(24,119,242,0.6)] hover:-translate-y-1">
                      <Facebook className="h-4 w-4 text-white" />
                    </a>
                    <a href="https://www.instagram.com/mythiumbd/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,39,67,0.6)] hover:-translate-y-1">
                      <Instagram className="h-4 w-4 text-white" />
                    </a>
                    <a href="https://www.tiktok.com/@mythiumbd" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="group flex items-center justify-center w-10 h-10 rounded-full bg-black border border-neutral-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:-translate-y-1">
                      <TikTokIcon className="h-4 w-4 text-white" style={{ filter: "drop-shadow(1.5px 1.5px 0 #ff0050) drop-shadow(-1.5px -1.5px 0 #00f2fe)" }} />
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Profile Drawer (Right-to-Left) */}
        <AnimatePresence>
          {mobileProfileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 w-full h-screen bg-black/40 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileProfileOpen(false)}
              />
              
              {/* Menu Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full right-0 w-full h-[calc(100dvh-4rem-60px)] glass-sidebar bg-white dark:bg-black flex flex-col overflow-hidden border-t border-neutral-200 dark:border-neutral-800 lg:hidden"
              >
                <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-20 flex flex-col gap-0.5">
                  <div className="px-3 pb-2 mb-2 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">My Account</h2>
                    <button onClick={() => setMobileProfileOpen(false)} className="text-neutral-500 hover:text-foreground p-1 -mr-1 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {[
                    { name: "My Profile", href: "/dashboard", icon: User },
                    { name: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
                    { name: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
                    { name: "Address Book", href: "/dashboard/addresses", icon: MapPin },
                    { name: "Settings", href: "/dashboard/settings", icon: Settings },
                    { name: "Help & Contact", href: "/support", icon: HelpCircle },
                  ].map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileProfileOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-md text-[13px] font-bold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-neutral-500" />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border pb-safe shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] dark:shadow-none">
        <div className="flex justify-around items-center h-[60px] px-1">
          {/* 1. Collections */}
          <button 
            onClick={() => {
              setMobileMenuOpen(true);
            }}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              mobileMenuOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`relative flex items-center justify-center transition-transform ${mobileMenuOpen ? "scale-110" : "scale-100"}`}>
              <LayoutGrid className="w-5 h-5" strokeWidth={mobileMenuOpen ? 2.5 : 2} />
              {mobileMenuOpen && (
                <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-foreground" />
              )}
            </div>
            <span className={`text-[9px] uppercase tracking-wider ${mobileMenuOpen ? "font-black" : "font-semibold"}`}>
              Collections
            </span>
          </button>

          {/* 2. Shop */}
          <Link 
            href="/products"
            onClick={closeMobileMenu}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              pathname === "/products" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`relative flex items-center justify-center transition-transform ${pathname === "/products" ? "scale-110" : "scale-100"}`}>
              <Store className="w-5 h-5" strokeWidth={pathname === "/products" ? 2.5 : 2} />
              {pathname === "/products" && (
                <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-foreground" />
              )}
            </div>
            <span className={`text-[9px] uppercase tracking-wider ${pathname === "/products" ? "font-black" : "font-semibold"}`}>
              Shop
            </span>
          </Link>

          {/* 3. Home */}
          <Link 
            href="/"
            onClick={closeMobileMenu}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`relative flex items-center justify-center transition-transform ${pathname === "/" ? "scale-110" : "scale-100"}`}>
              <Home className="w-5 h-5" strokeWidth={pathname === "/" ? 2.5 : 2} />
              {pathname === "/" && (
                <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-foreground" />
              )}
            </div>
            <span className={`text-[9px] uppercase tracking-wider ${pathname === "/" ? "font-black" : "font-semibold"}`}>
              Home
            </span>
          </Link>

          {/* 4. Cart */}
          <Link 
            href="/cart"
            onClick={closeMobileMenu}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              pathname === "/cart" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`relative flex items-center justify-center transition-transform ${pathname === "/cart" ? "scale-110" : "scale-100"}`}>
              <ShoppingBag className="w-5 h-5" strokeWidth={pathname === "/cart" ? 2.5 : 2} />
              {pathname === "/cart" && (
                <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-foreground" />
              )}
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-white shadow-md">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            <span className={`text-[9px] uppercase tracking-wider ${pathname === "/cart" ? "font-black" : "font-semibold"}`}>
              Cart
            </span>
          </Link>

          {/* 5. Account */}
          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className="w-5 h-5 rounded-full animate-pulse bg-foreground/20" />
            </div>
          ) : session?.user ? (
            <button 
              onClick={() => {
                closeMobileMenu();
                setMobileProfileOpen(!mobileProfileOpen);
              }}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                mobileProfileOpen || pathname?.startsWith("/dashboard") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`relative flex items-center justify-center transition-transform ${mobileProfileOpen || pathname?.startsWith("/dashboard") ? "scale-110" : "scale-100"}`}>
                <div className={`w-5 h-5 rounded-full overflow-hidden border ${mobileProfileOpen || pathname?.startsWith("/dashboard") ? "border-foreground" : "border-foreground/40"}`}>
                  <Image src={session.user.image || 'https://via.placeholder.com/150'} alt="Profile" width={20} height={20} className="w-full h-full object-cover" />
                </div>
                {(mobileProfileOpen || pathname?.startsWith("/dashboard")) && (
                  <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-foreground" />
                )}
              </div>
              <span className={`text-[9px] uppercase tracking-wider ${mobileProfileOpen || pathname?.startsWith("/dashboard") ? "font-black" : "font-semibold"}`}>
                Account
              </span>
            </button>
          ) : (
            <Link 
              href="/login"
              onClick={closeMobileMenu}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                pathname === "/login" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`relative flex items-center justify-center transition-transform ${pathname === "/login" ? "scale-110" : "scale-100"}`}>
                <User className="w-5 h-5" strokeWidth={pathname === "/login" ? 2.5 : 2} />
                {pathname === "/login" && (
                  <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-foreground" />
                )}
              </div>
              <span className={`text-[9px] uppercase tracking-wider ${pathname === "/login" ? "font-black" : "font-semibold"}`}>
                Login
              </span>
            </Link>
          )}
        </div>
      </div>
      
      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
