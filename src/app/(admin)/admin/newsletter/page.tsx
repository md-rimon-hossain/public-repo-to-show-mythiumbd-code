"use client";

import React, { useEffect, useState } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Mail, Send, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ subject: '', content: '', type: 'general', productId: '' });

  useEffect(() => { 
    fetchSubscribers(); 
    fetchProducts();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/newsletter/subscribers?limit=10');
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.data);
        setTotalSubscribers(data.total || 0);
      }
    } catch {
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch {
      toast.error('Failed to load products');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.content) {
      toast.error('Subject and content are required');
      return;
    }
    if (form.type === 'product_launch' && !form.productId) {
      toast.error('Please select a product for the launch email');
      return;
    }
    if (totalSubscribers === 0) {
      toast.error('No subscribers to send to');
      return;
    }
    try {
      setSending(true);
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Newsletter sent successfully!');
        setForm({ subject: '', content: '', type: 'general', productId: '' });
      } else {
        toast.error(data.errors?.[0]?.message || data.message || 'Failed to send');
      }
    } catch {
      toast.error('Failed to Send Newsletter');
    } finally {
      setSending(false);
    }
  };

  return (
  
    <div className="space-y-4 md:space-y-6">
      <div className="border-b border-border pb-3 md:pb-6">
        <h1 className="text-xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-1 md:mb-2">Newsletter</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-[10px] md:text-sm uppercase tracking-widest md:tracking-[0.2em] font-semibold">Send updates & product launches.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Stats & List */}
        <div className="space-y-4 md:space-y-6 lg:col-span-1">
          <div className="border border-border bg-background rounded-none md:rounded-xl p-4 md:p-6 flex items-center gap-3 md:gap-4 -mx-4 md:mx-0">
            <div className="p-3 md:p-4 border-2 border-blue-500 bg-blue-500/10 text-blue-500">
              <Users size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 md:mb-2">Total Subscribers</p>
              {loading ? (
                <Loader2 className="animate-spin text-foreground mt-1" size={20} />
              ) : (
                <h2 className="text-xl md:text-3xl font-black text-foreground">{totalSubscribers.toLocaleString()}</h2>
              )}
            </div>
          </div>
          
          <div className="border-0 border-t border-b md:border border-border bg-background rounded-none md:rounded-xl p-4 md:p-6 -mx-4 md:mx-0">
            <h3 className="text-[10px] md:text-xs font-black text-foreground uppercase tracking-widest mb-3 md:mb-4">RECENT SUBSCRIBERS</h3>
            {loading ? (
              <LoadingSpinnerIphone />
            ) : subscribers.length === 0 ? (
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground text-center py-4 uppercase ">No subscribers yet</p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {subscribers.map((sub: any) => (
                  <div key={sub._id} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 border border-border bg-background hover:border-foreground transition-colors">
                    <Mail size={14} className="text-muted-foreground shrink-0 md:w-4 md:h-4" />
                    <span className="text-[9px] md:text-[10px] font-bold text-foreground truncate uppercase ">{sub.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Composer */}
        <div className="lg:col-span-2 border-0 border-t border-b md:border border-border bg-background rounded-none md:rounded-xl p-4 md:p-6 -mx-4 md:mx-0">
          <h2 className="text-sm md:text-lg font-black text-foreground uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2 border-b border-border pb-3 md:pb-4">
            <Send size={16} className="text-emerald-500 md:w-5 md:h-5" /> COMPOSE EMAIL
          </h2>
          
          <form onSubmit={handleSend} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">SUBJECT *</label>
              <input
                type="text"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-transparent border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest placeholder:text-muted-foreground/50"
                placeholder="E.G. HUGE WINTER SALE STARTS NOW!"
                value={form.subject}
                onChange={e => setForm({...form, subject: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">EMAIL TYPE</label>
                <select
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-background border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest appearance-none"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="general">GENERAL NEWSLETTER</option>
                  <option value="product_launch">PRODUCT LAUNCH</option>
                </select>
              </div>

              {form.type === 'product_launch' && (
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">SELECT PRODUCT *</label>
                  <select
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-background border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors uppercase tracking-widest appearance-none"
                    value={form.productId}
                    onChange={e => setForm({...form, productId: e.target.value})}
                    required
                  >
                    <option value="" disabled>CHOOSE A PRODUCT</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-medium text-muted-foreground mb-1.5 md:mb-2">CONTENT *</label>
              <textarea 
                rows={8} 
                className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-transparent border border-border focus:border-foreground outline-none text-[10px] md:text-xs font-bold text-foreground transition-colors resize-none placeholder:text-muted-foreground/50 placeholder:uppercase placeholder:tracking-widest md:h-auto h-32"
                placeholder="Write your email content here..."
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                required
              ></textarea>
            </div>

            <div className="flex pt-3 md:pt-4 border-t border-border">
              <button
                type="submit"
                disabled={sending || totalSubscribers === 0}
                className="w-full md:w-auto px-4 md:px-6 py-3 border border-border bg-foreground text-background font-semibold text-[10px] md:text-xs hover:bg-transparent hover:text-foreground transition-colors flex items-center justify-center gap-2 md:ml-auto disabled:opacity-50 uppercase"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? 'SENDING...' : `SEND TO ${totalSubscribers} SUBSCRIBER${totalSubscribers !== 1 ? 'S' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
