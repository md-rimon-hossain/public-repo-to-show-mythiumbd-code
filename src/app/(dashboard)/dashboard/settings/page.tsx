"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Save, User, Mail, Phone } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    phone: '',
  });

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/users/profile');
        const data = await res.json();
        if (data.success && data.data) {
          setFormData({
            name: data.data.name || session?.user?.name || '',
            phone: data.data.phone || '',
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchProfile();
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || undefined,
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update settings');
        if (data.errors) {
          toast.error(data.errors[0]?.message);
        }
      }
    } catch (err) {
      toast.error('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-12 pb-6 md:pb-10">
      
      {/* Header Section */}
      <header className="border-b-2 border-border pb-4 md:pb-6 pt-2">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">Account Settings</h1>
        <p className="text-xs md:text-base text-muted-foreground font-medium">Manage your personal information and communication preferences.</p>
      </header>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6 md:space-y-10">
        
        <section>
          <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-foreground mb-4 md:mb-6 flex items-center gap-2 md:gap-3 pb-2 border-b border-border/50">
            <User size={16} className="md:w-[18px] md:h-[18px]" /> General Information
          </h3>
          
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest">Full Name</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-10 md:h-12 px-3 md:px-4 bg-transparent border-2 border-border rounded-lg md:rounded-xl focus:border-foreground focus:ring-0 transition-colors text-sm font-medium"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                Email Address
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  value={session?.user?.email || ""}
                  disabled
                  className="w-full h-10 md:h-12 px-3 md:px-4 pl-9 md:pl-11 bg-muted/30 border-2 border-border rounded-lg md:rounded-xl text-sm font-medium text-muted-foreground cursor-not-allowed"
                />
                <Mail size={14} className="md:w-4 md:h-4 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Managed securely by your login provider.</p>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest">Phone Number</label>
              <div className="relative">
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full h-10 md:h-12 px-3 md:px-4 pl-9 md:pl-11 bg-transparent border-2 border-border rounded-lg md:rounded-xl focus:border-foreground focus:ring-0 transition-colors text-sm font-medium"
                />
                <Phone size={14} className="md:w-4 md:h-4 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex pt-4 md:pt-6 border-t-2 border-border justify-end w-full">
          <button 
            type="submit" 
            disabled={loading}
            className="group relative h-10 md:h-14 px-5 md:px-8 flex items-center justify-center font-black uppercase tracking-widest text-[10px] md:text-sm border-2 border-foreground bg-foreground text-background overflow-hidden transition-all duration-500 hover:shadow-xl rounded-lg md:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
            <span className="relative z-10 flex items-center gap-2 group-hover:text-foreground transition-colors duration-500">
              <Save size={14} className="md:w-[18px] md:h-[18px]" /> {loading ? "Saving..." : "Save Settings"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
