"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Save, User, Mail, Phone, MapPin, ShieldCheck, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserProfilePage() {
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    phone: '',
    division: '',
    zila: '',
    upazila: '',
    village: '',
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
            division: data.data.address?.division || '',
            zila: data.data.address?.zila || '',
            upazila: data.data.address?.upazila || '',
            village: data.data.address?.village || '',
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchProfile();
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || undefined,
          address: {
            division: formData.division,
            zila: formData.zila,
            upazila: formData.upazila,
            village: formData.village,
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
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
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">My Profile</h1>
        <p className="text-xs md:text-base text-muted-foreground font-medium">Manage your personal information, security, and delivery preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-12 items-start">
        
        {/* Left Column: Profile Card */}
        <aside className="lg:col-span-4">
          <div className="bg-background border-2 border-border rounded-xl md:rounded-2xl p-5 md:p-8 flex flex-col md:flex-col items-center sm:flex-row sm:text-left text-center shadow-sm relative overflow-hidden group gap-4 md:gap-0">
            
            <div className="relative w-24 h-24 sm:w-20 sm:h-20 md:w-40 md:h-40 rounded-full border-4 border-foreground mb-0 md:mb-6 flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center">
              <Image 
                src={session?.user?.image || 'https://via.placeholder.com/200'} 
                alt="Profile" 
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Edit3 className="text-white" size={24} />
              </div>
            </div>
            
            <div className="flex flex-col items-center sm:items-start md:items-center flex-1">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-widest text-foreground mb-0.5 md:mb-1">{session?.user?.name || 'User'}</h2>
              <p className="text-xs md:text-sm text-muted-foreground font-medium mb-3 md:mb-6">{session?.user?.email}</p>
              
              <div className="w-full flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-3 px-3 md:px-4 border border-border rounded-lg md:rounded-xl bg-muted/30 text-[10px] md:text-xs text-foreground font-bold uppercase tracking-widest">
                <ShieldCheck size={14} className="md:w-4 md:h-4 text-foreground" /> Verified Account
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Edit Form */}
        <main className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
            
            {/* Personal Info Section */}
            <section>
              <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-foreground mb-4 md:mb-6 flex items-center gap-2 md:gap-3 pb-2 border-b border-border/50">
                <User size={16} className="md:w-[18px] md:h-[18px]" /> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-10 md:h-12 px-3 md:px-4 bg-transparent border-2 border-border rounded-lg md:rounded-xl focus:border-foreground focus:ring-0 transition-colors text-sm font-medium" 
                    placeholder="+880 1XXX-XXXXXX"
                  />
                </div>
              </div>
            </section>

            {/* Delivery Address Section */}
            <section>
              <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-foreground mb-4 md:mb-6 flex items-center gap-2 md:gap-3 pb-2 border-b border-border/50">
                <MapPin size={16} className="md:w-[18px] md:h-[18px]" /> Delivery Address
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest">Division</label>
                  <div className="relative">
                    <select name="division" value={formData.division} onChange={handleChange} className="w-full h-10 md:h-12 px-3 md:px-4 bg-transparent border-2 border-border rounded-lg md:rounded-xl focus:border-foreground focus:ring-0 transition-colors text-sm font-medium appearance-none cursor-pointer">
                      <option value="" className="bg-background text-foreground">Select Division</option>
                      <option value="dhaka" className="bg-background text-foreground">Dhaka</option>
                      <option value="chittagong" className="bg-background text-foreground">Chittagong</option>
                      <option value="sylhet" className="bg-background text-foreground">Sylhet</option>
                      <option value="rajshahi" className="bg-background text-foreground">Rajshahi</option>
                      <option value="khulna" className="bg-background text-foreground">Khulna</option>
                      <option value="barishal" className="bg-background text-foreground">Barishal</option>
                      <option value="rangpur" className="bg-background text-foreground">Rangpur</option>
                      <option value="mymensingh" className="bg-background text-foreground">Mymensingh</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest">Zila (District)</label>
                  <input 
                    type="text" 
                    name="zila"
                    value={formData.zila}
                    onChange={handleChange}
                    className="w-full h-10 md:h-12 px-3 md:px-4 bg-transparent border-2 border-border rounded-lg md:rounded-xl focus:border-foreground focus:ring-0 transition-colors text-sm font-medium" 
                    placeholder="e.g. Dhaka"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest">Upazila / Thana</label>
                  <input 
                    type="text" 
                    name="upazila"
                    value={formData.upazila}
                    onChange={handleChange}
                    className="w-full h-10 md:h-12 px-3 md:px-4 bg-transparent border-2 border-border rounded-lg md:rounded-xl focus:border-foreground focus:ring-0 transition-colors text-sm font-medium" 
                    placeholder="e.g. Dhanmondi"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest">Village / House & Road</label>
                  <input 
                    type="text" 
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    className="w-full h-10 md:h-12 px-3 md:px-4 bg-transparent border-2 border-border rounded-lg md:rounded-xl focus:border-foreground focus:ring-0 transition-colors text-sm font-medium" 
                    placeholder="e.g. House 12, Road 5"
                  />
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex justify-end pt-4 md:pt-6 border-t-2 border-border">
              <button 
                type="submit" 
                disabled={loading}
                className="group relative h-10 md:h-14 px-5 md:px-8 flex items-center justify-center font-black uppercase tracking-widest text-[10px] md:text-sm border-2 border-foreground bg-foreground text-background overflow-hidden transition-all duration-500 hover:shadow-xl rounded-lg md:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
                <span className="relative z-10 flex items-center gap-2 group-hover:text-foreground transition-colors duration-500">
                  <Save size={14} className="md:w-[18px] md:h-[18px]" /> {loading ? "Saving..." : "Save Changes"}
                </span>
              </button>
            </div>
            
          </form>
        </main>
      </div>
    </div>
  );
}
