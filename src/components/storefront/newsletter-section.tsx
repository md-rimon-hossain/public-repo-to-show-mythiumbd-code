"use client";

import { useState } from "react";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";


export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || "Successfully subscribed to our newsletter!");
        setEmail("");
      } else {
        toast.error(data.errors?.[0]?.message || data.message || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-8 md:py-10 relative overflow-hidden bg-background my-4 mx-4 md:mx-auto md:max-w-5xl rounded-2xl border border-foreground/30">
      <div className="container mx-auto px-1 md:px-4 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full mb-4 border border-foreground/20 bg-background">
            <Mail className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
          </div>
          
          <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tight text-foreground">Stay in the Loop</h2>
          <p className="text-xs md:text-sm text-muted-foreground mb-5 font-medium px-4">
            Subscribe to get special offers, early access to exclusive drops, and once-in-a-lifetime deals.
          </p>
          
          <form onSubmit={handleSubmit} className="flex w-full max-w-md mx-auto relative items-center p-1 border border-foreground/30 rounded-full bg-background transition-all duration-300">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="flex-grow h-8 md:h-10 pl-4 md:pl-5 bg-transparent border-none outline-none text-xs md:text-sm font-medium text-foreground placeholder:text-muted-foreground w-full disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="group relative h-8 md:h-10 rounded-full px-5 md:px-8 shrink-0 bg-foreground text-background font-bold tracking-widest uppercase text-[9px] md:text-xs overflow-hidden border border-foreground transition-all duration-500 flex items-center justify-center disabled:opacity-70"
            >
              <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
              <span className="relative z-10 flex items-center gap-1.5 md:gap-2 group-hover:text-foreground transition-colors duration-500">
                {loading ? "..." : (
                  <>Subscribe <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" /></>
                )}
              </span>
            </button>
          </form>
          
          <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mt-5">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  );
}

