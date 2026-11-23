"use client";

import { signIn } from "next-auth/react";
import { Shield, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import mythiumLogo from "@/assets/final_black_logo.svg";
import whiteLogo from "@/assets/final_white_logo.svg";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Column: Brand Showcase (Desktop Only) */}
      <div className="hidden lg:flex flex-col relative h-full w-full bg-black p-12 overflow-hidden">
        {/* Dynamic mesh background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/30 blur-[120px]"></div>
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[100px]"></div>
        </div>
        
        {/* Top left link */}
        <div className="relative z-10 flex-1">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Store
          </Link>
        </div>
        
        {/* Bottom text */}
        <div className="relative z-10 text-white">
          <div className="w-48 mb-8">
            <Image src={whiteLogo} alt="Mythium" className="w-full h-auto object-contain" />
          </div>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
            Engineered for <br/> the Modern Era.
          </h1>
          <p className="text-lg font-medium text-white/60 max-w-md leading-relaxed">
            Sign in to unlock exclusive collections, track your premium orders, and elevate your style.
          </p>
        </div>
      </div>

      {/* Right Column: Login Interface */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-12 lg:p-24 min-h-screen lg:min-h-0 lg:h-full relative">
        {/* Mobile back link */}
        <Link href="/" className="lg:hidden absolute top-4 left-4 text-muted-foreground hover:text-foreground flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} /> Store
        </Link>
        
        <div className="w-full max-w-[380px] text-center mt-6 lg:mt-0">
          <div className="lg:hidden w-24 h-auto mx-auto mb-4">
            <Image src={mythiumLogo} alt="Mythium" className="w-full h-auto object-contain dark:hidden" />
            <Image src={whiteLogo} alt="Mythium" className="w-full h-auto object-contain hidden dark:block" />
          </div>

          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground mb-6 md:mb-10">
            Please <span className="ml-2 md:ml-3">Login</span>
          </h2>

          <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4 md:p-5 mb-6 md:mb-8 text-left shadow-sm">
            <div className="space-y-2">
              <h3 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-foreground mb-3 md:mb-4">Member Benefits</h3>
              <ul className="text-[11px] md:text-xs font-medium text-muted-foreground space-y-3">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" /> Faster checkout process</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" /> Track your orders easily</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" /> Save items to your wishlist</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" /> Access exclusive offers</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const callbackUrl = urlParams.get('callbackUrl') || '/';
              signIn('google', { callbackUrl });
            }}
            className="group relative w-full inline-flex items-center justify-center px-6 py-4 text-xs font-bold tracking-widest text-background uppercase bg-foreground rounded-full overflow-hidden border border-foreground transition-all duration-500 hover:shadow-xl"
          >
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
            <span className="relative z-10 group-hover:text-foreground transition-colors duration-500 flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </span>
          </button>
          
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            One click login. It takes just 30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
