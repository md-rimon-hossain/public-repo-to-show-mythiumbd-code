"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';

export default function AddressesPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-12 pb-6 md:pb-10">
      
      {/* Header Section */}
      <header className="border-b-2 border-border pb-4 md:pb-6 pt-2">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">Address Book</h1>
        <p className="text-xs md:text-base text-muted-foreground font-medium">Manage your shipping destinations for a seamless checkout experience.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Default Address Card */}
        <div className="p-5 md:p-8 rounded-xl md:rounded-2xl border-2 border-foreground/30 hover:border-foreground/50 bg-background relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 md:mb-6">
            <span className="bg-foreground text-background text-[9px] md:text-[10px] px-2.5 md:px-3 py-1 font-black uppercase tracking-widest flex items-center gap-1 md:gap-1.5">
              <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" strokeWidth={2.5} /> Default
            </span>
            <div className="flex gap-2">
              <button className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:border-foreground transition-all text-muted-foreground hover:text-foreground">
                <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          <h3 className="font-black text-lg md:text-xl text-foreground mb-2 md:mb-3 uppercase tracking-wider">{session?.user?.name || "User"}</h3>
          
          <div className="space-y-1 text-xs md:text-sm font-medium text-muted-foreground mb-4 md:mb-6">
            <p>House 12, Road 5</p>
            <p>Dhanmondi, Dhaka</p>
            <p>Bangladesh</p>
          </div>
          
          <div className="pt-3 md:pt-4 border-t-2 border-border/50 text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">
            Ph: +880 1XXX-XXXXXX
          </div>
        </div>

        {/* Add New Address Card */}
        <button className="group p-5 md:p-8 rounded-xl md:rounded-2xl border-2 border-dashed border-border bg-transparent flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/30 transition-all min-h-[160px] sm:min-h-[250px] md:min-h-[280px]">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-border group-hover:border-foreground group-hover:bg-foreground group-hover:text-background flex items-center justify-center mb-3 md:mb-4 transition-all duration-300">
            <Plus className="w-5 h-5 md:w-7 md:h-7 transition-transform group-hover:rotate-90 duration-300" strokeWidth={2.5} />
          </div>
          <span className="font-black text-xs md:text-sm uppercase tracking-widest mt-1 md:mt-2 group-hover:-translate-y-1 transition-transform duration-300">Add New Address</span>
        </button>
        
      </div>
    </div>
  );
}
