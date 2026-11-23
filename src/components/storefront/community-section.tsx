"use client";

import { useState } from "react";
import { HeadphonesIcon, Truck, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function CommunitySection() {
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

  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Free Shipping",
      description: "On all orders over ৳4000",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Secure Payment",
      description: "100% secure checkout",
    },
    {
      icon: <HeadphonesIcon className="h-6 w-6" />,
      title: "24/7 Support",
      description: "Dedicated support team",
    },
  ];

  return (
    <section className="py-4 md:py-16">
      <div className="container mx-auto px-0 md:px-6">
        <div className="bg-transparent md:bg-foreground/[0.03] md:dark:bg-foreground/[0.02] border-y border-foreground/10 md:border md:rounded-[2.5rem] p-5 md:p-12 lg:p-16 relative overflow-hidden">
          
          {/* Subtle background blur effects */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-blue-500/5 rounded-full blur-[60px] md:blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

          <div className="relative z-10">
            {/* Top Row: Features */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 md:p-8 flex flex-col items-center text-center bg-background rounded-3xl border border-foreground/5 shadow-sm hover:shadow-md hover:border-foreground/20 transition-all duration-500 group"
                >
                  <div className="h-14 w-14 rounded-full bg-foreground/5 flex items-center justify-center mb-5 text-foreground group-hover:scale-110 group-hover:bg-foreground group-hover:text-background transition-all duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-12 md:mb-20" /> */}

            {/* Bottom Row: Split between Help and Newsletter */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              
              {/* Help */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-6 leading-none">
                  Need <br className="hidden lg:block" /> Assistance?
                </h2>
                <p className="text-sm md:text-lg text-muted-foreground font-medium mb-6 md:mb-10 max-w-[280px] md:max-w-md mx-auto lg:mx-0 leading-relaxed">
                  Our dedicated support team is available 24/7 to assist you with any questions, styling advice, or order concerns.
                </p>
                <Link href="/support" className="inline-block">
                  <button className="group relative inline-flex items-center justify-center w-full md:w-auto px-6 py-3 md:px-8 md:py-4 text-[10px] md:text-xs font-bold tracking-widest text-background uppercase bg-foreground rounded-full overflow-hidden border border-foreground transition-all duration-500 shadow-none md:shadow-xl hover:shadow-2xl">
                    <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
                    <span className="relative z-10 group-hover:text-foreground transition-colors duration-500 flex items-center gap-2">
                      Contact Support <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>
              </div>

              {/* Newsletter */}
              <div className="bg-transparent md:bg-background rounded-none md:rounded-[2rem] p-0 md:p-12 border-none md:border border-foreground/10 shadow-none md:shadow-xl relative overflow-hidden group hover:border-foreground/20 transition-all duration-500 w-full">
                <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 text-foreground group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none hidden md:block">
                  <Mail className="w-24 h-24 md:w-32 md:h-32" />
                </div>
                
                <div className="relative z-10 text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full mb-4 md:mb-6 bg-foreground text-background">
                    <Mail className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-2 md:mb-3 tracking-tight text-foreground">Stay in the Loop</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-6 md:mb-8 font-medium max-w-[280px] md:max-w-sm leading-relaxed mx-auto md:mx-0">
                    Subscribe to get special offers, early access to exclusive drops, and once-in-a-lifetime deals.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="flex flex-col md:flex-row w-full gap-2 md:gap-3 relative">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="flex-grow h-11 md:h-14 px-5 md:px-6 rounded-full bg-foreground/[0.03] border border-foreground/10 outline-none text-xs md:text-sm font-medium text-foreground placeholder:text-muted-foreground w-full disabled:opacity-50 focus:border-foreground/30 focus:bg-background transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="h-11 md:h-14 rounded-full px-6 md:px-8 shrink-0 bg-foreground text-background font-bold tracking-widest uppercase text-[10px] md:text-xs overflow-hidden transition-all duration-500 flex items-center justify-center disabled:opacity-70 hover:opacity-90 shadow-sm md:shadow-md hover:shadow-lg"
                    >
                      {loading ? "..." : "Subscribe"}
                    </button>
                  </form>
                  
                  <p className="text-[9px] md:text-xs font-semibold text-muted-foreground mt-5 md:mt-6 text-center sm:text-left">
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
