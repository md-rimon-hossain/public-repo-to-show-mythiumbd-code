"use client";

import Link from "next/link";
import Image from "next/image";
import mythiumLogo from "@/assets/final_black_logo.svg";
import whiteLogo from "@/assets/final_white_logo.svg";
import { Facebook, Instagram, Phone, MessageCircle, MapPin } from "lucide-react";
import { NewsletterSection } from "./newsletter-section";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/checkout") {
    return null;
  }

  return (
    <footer className="relative mt-6 pt-6 md:mt-10 border-t border-neutral-900 bg-black text-white overflow-hidden">
      
      <div className="container mx-auto px-4 md:px-6 pb-8 md:pb-16 pt-6 md:pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-16">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image src={whiteLogo} alt="Mythium" className="h-12 w-auto" />
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xs">
              Premium men's fashion engineered for the modern era. Redefining style with pure glassmorphism aesthetics.
            </p>
            <div className="flex gap-3 pt-6">
              <a href="https://www.facebook.com/mythiumbd" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="group flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] transition-all duration-300 hover:shadow-[0_0_15px_rgba(24,119,242,0.6)] hover:-translate-y-1">
                <Facebook className="h-4 w-4 text-white" />
              </a>
              <a href="https://www.instagram.com/mythiumbd/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,39,67,0.6)] hover:-translate-y-1">
                <Instagram className="h-4 w-4 text-white" />
              </a>
              <a href="https://www.tiktok.com/@mythiumbd" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="group flex items-center justify-center w-10 h-10 rounded-full bg-black border border-neutral-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:-translate-y-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white" style={{ filter: "drop-shadow(1.5px 1.5px 0 #ff0050) drop-shadow(-1.5px -1.5px 0 #00f2fe)" }}>
                  <path d="M16.6 5.82c-.9-.98-1.39-2.26-1.38-3.57h-3.05v13.6c0 1.5-1.22 2.72-2.72 2.72a2.72 2.72 0 0 1 0-5.44c.28 0 .55.04.8.12V9.9a5.8 5.8 0 0 0-.8-.06 5.77 5.77 0 1 0 5.77 5.77V8.86a8.6 8.6 0 0 0 5.03 1.6V7.4a5.6 5.6 0 0 1-3.65-1.58z" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 md:mb-6">Customer Support</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><Link href="/support" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">FAQ & Help Center</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 md:mb-6">Get in Touch</h4>
            <ul className="space-y-3 md:space-y-4 text-sm text-neutral-400">
              <li className="flex gap-3 items-start">
                <Phone className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-medium text-white text-[10px] uppercase tracking-widest mb-0.5">Call Us</span>
                  <span>01817-854326</span>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-medium text-white text-[10px] uppercase tracking-widest mb-0.5">WhatsApp</span>
                  <span>+880 1817-854326</span>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-medium text-white text-[10px] uppercase tracking-widest mb-0.5">Visit Us</span>
                  <span>Taragunia Bus-stand, Alim Complex 2nd Floor, Daulatpur-Kushtia. 📍</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-[10px] md:text-xs text-neutral-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} Mythium. All rights reserved.
          </p>
          <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-neutral-500">
            <span>Currency: BDT (৳)</span>
            <span>Language: English</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

