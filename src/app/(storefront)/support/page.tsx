"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, MessageSquare, ChevronDown, Loader2, Package, Undo2, Star, CreditCard, Ruler, Search, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const FAQS = [
  {
    icon: <Package className="w-5 h-5 mr-3 text-muted-foreground" />,
    question: "Shipping & Delivery",
    answer: "We offer fast, reliable shipping nationwide. Deliveries within Dhaka take 1-2 business days, while outside Dhaka takes 3-5 business days. Shipping costs are calculated seamlessly at checkout based on your delivery zone. Enjoy FREE shipping on all orders over ৳4000!"
  },
  {
    icon: <Search className="w-5 h-5 mr-3 text-muted-foreground" />,
    question: "Order Tracking",
    answer: "As soon as your order is dispatched, you will receive an SMS and email containing your tracking code. You can use this code to monitor your delivery in real-time."
  },
  {
    icon: <Undo2 className="w-5 h-5 mr-3 text-muted-foreground" />,
    question: "Returns & Exchanges",
    answer: (
      <div className="space-y-4">
        <p>Please ensure the "Return" tag remains attached to the garment. If something isn't quite right, you have 4 days from delivery to request a full refund or exchange.</p>
        <p>All we ask is that items are returned in an unused, unaltered condition complete with their original tags and premium packaging.</p>
      </div>
    )
  },
  {
    icon: <Ruler className="w-5 h-5 mr-3 text-muted-foreground" />,
    question: "Sizing & Fit",
    answer: "Each product features a detailed sizing chart in its description. Our garments are engineered for a modern, true-to-size fit. If you prefer a more relaxed or oversized aesthetic, we recommend sizing up."
  },
  {
    icon: <CreditCard className="w-5 h-5 mr-3 text-muted-foreground" />,
    question: "Payment Methods",
    answer: "We currently accept bKash and Cash on Delivery (COD). Please note that for COD orders, the delivery charge must be paid in advance to confirm your order. If your order is over ৳4000, delivery is completely free!"
  },
  {
    icon: <XCircle className="w-5 h-5 mr-3 text-muted-foreground" />,
    question: "Order Cancellations",
    answer: "We process orders quickly to ensure fast delivery. You may cancel or modify your order within 2 hours of placement by contacting our support team directly via phone or WhatsApp."
  },
  {
    icon: <Star className="w-5 h-5 mr-3 text-muted-foreground" />,
    question: "Join the Community",
    answer: "Stay updated with our latest drops, styling tips, and exclusive offers! Follow us on Facebook, Instagram, and TikTok. Tag us in your photos for a chance to be featured on our page. Join our growing community of Mythium today!"
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-1 md:px-4 py-8 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-8 md:mb-20">
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-2 md:mb-4 text-foreground leading-none">Support</h1>
        <p className="text-muted-foreground text-[10px] md:text-sm uppercase tracking-[0.2em] font-semibold">How can we assist you today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 max-w-6xl mx-auto">
        <div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-4 md:mb-8 text-foreground">FAQs</h2>
          <div className="space-y-2 md:space-y-4">
            {FAQS.map((faq, index) => (
              <div key={index} className="border hover:border-border rounded-lg md:rounded-xl bg-background overflow-hidden border-foreground/40 transition-colors duration-300">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-4 py-3 md:px-6 md:py-5 flex justify-between items-center text-left font-bold text-foreground text-xs md:text-base group"
                >
                  <span className="flex items-center">
                    {faq.icon}
                    {faq.question}
                  </span>
                  <ChevronDown size={18} className={`shrink-0 ml-4 transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 md:px-6 md:pb-6 text-muted-foreground font-medium text-[11px] md:text-sm leading-relaxed"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-4 md:mb-8 text-foreground">Contact Us</h2>
          <div className="p-4 md:p-10 border border-border/30 hover:border-border rounded-xl md:rounded-2xl bg-background">
            <div className="space-y-4 md:space-y-8 mb-6 md:mb-10">
              <div className="flex items-center gap-3 md:gap-5 group cursor-default">
                <div className="w-8 h-8 md:w-14 md:h-14 rounded-full border border-border flex shrink-0 items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                  <Phone className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5 md:mb-1">Call Us / WhatsApp</p>
                  <p className="text-xs md:text-base font-semibold text-foreground">01817-854326, +880 1817-854326</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-5 group cursor-default">
                <div className="w-8 h-8 md:w-14 md:h-14 rounded-full border border-border flex shrink-0 items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                  <Mail className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5 md:mb-1">Email</p>
                  <p className="text-xs md:text-base font-semibold text-foreground">support@mythium.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-5 group cursor-default">
                <div className="w-8 h-8 md:w-14 md:h-14 rounded-full border border-border flex shrink-0 items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5 md:mb-1">Address</p>
                  <p className="text-xs md:text-base font-semibold text-foreground">Taragunia Bus-stand, Alim Complex 2nd Floor, Daulatpur-Kushtia. 📍</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5 md:space-y-4">
              <input 
                type="text" 
                placeholder="Your Name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                className="w-full p-2.5 md:p-4 bg-transparent border border-border rounded-lg md:rounded-xl text-[11px] md:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-300 outline-none disabled:opacity-50" 
              />
              <input 
                type="email" 
                placeholder="Your Email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="w-full p-2.5 md:p-4 bg-transparent border border-border rounded-lg md:rounded-xl text-[11px] md:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-300 outline-none disabled:opacity-50" 
              />
              <textarea 
                placeholder="How can we help you?" 
                rows={3} 
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                disabled={loading}
                className="w-full p-2.5 md:p-4 bg-transparent border border-border rounded-lg md:rounded-xl text-[11px] md:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-300 outline-none resize-none disabled:opacity-50"
              ></textarea>
              
              <div className="pt-1 md:pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="group relative w-full inline-flex items-center justify-center px-4 py-2.5 md:px-8 md:py-4 text-[10px] md:text-xs font-bold tracking-widest text-background uppercase bg-foreground rounded-full overflow-hidden border border-foreground transition-all duration-500 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
                  <span className="relative z-10 group-hover:text-foreground transition-colors duration-500 flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                        Send Message
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

