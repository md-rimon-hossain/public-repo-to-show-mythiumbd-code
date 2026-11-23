"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative flex-shrink-0 ${checked ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
  </div>
);

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    fullBkash: true,
    codWithAdvance: true,
    fullCod: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data && data.data.paymentOptions) {
        setSettings(data.data.paymentOptions);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentOptions: settings })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment options updated successfully');
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinnerIphone />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3 md:pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">Payment Settings</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-[10px] md:text-sm uppercase tracking-widest md:tracking-[0.2em] font-semibold">Configure checkout options.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-foreground text-background px-4 md:px-6 py-2 md:py-2.5 font-bold hover:bg-foreground/90 transition-colors text-[10px] md:text-xs tracking-widest w-full sm:w-auto text-center"
        >
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </div>

      <div className="border-0 border-t border-b md:border border-border bg-background p-4 md:p-6 rounded-none md:rounded-xl -mx-4 md:mx-0">
        <h2 className="text-sm md:text-lg font-black uppercase tracking-widest mb-2 md:mb-4">Checkout Payment Options</h2>
        <p className="text-[10px] md:text-sm text-muted-foreground mb-4 md:mb-6 font-medium uppercase tracking-wider">
          Toggle which payment options are available to customers during checkout.
        </p>
        
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-start md:items-center justify-between border-b border-border pb-4 md:pb-6 gap-4">
            <div className="space-y-1 md:space-y-2 pr-2 md:pr-4 flex-1">
              <label className="text-xs md:text-base font-black block uppercase">1. Cash on Delivery (with advance)</label>
              <p className="text-[9px] md:text-sm text-muted-foreground leading-relaxed">Customers pay delivery charge via bKash, rest in cash. If order is 4000tk or more, delivery is free so no advance is required.</p>
            </div>
            <div className="pt-1 md:pt-0 shrink-0">
              <ToggleSwitch checked={settings.codWithAdvance} onChange={() => handleToggle('codWithAdvance')} />
            </div>
          </div>

          <div className="flex items-start md:items-center justify-between border-b border-border pb-4 md:pb-6 gap-4">
            <div className="space-y-1 md:space-y-2 pr-2 md:pr-4 flex-1">
              <label className="text-xs md:text-base font-black block uppercase">2. Full Cash on Delivery</label>
              <p className="text-[9px] md:text-sm text-muted-foreground leading-relaxed">Customers pay nothing upfront. The entire amount is collected upon delivery.</p>
            </div>
            <div className="pt-1 md:pt-0 shrink-0">
              <ToggleSwitch checked={settings.fullCod} onChange={() => handleToggle('fullCod')} />
            </div>
          </div>

          <div className="flex items-start md:items-center justify-between gap-4">
            <div className="space-y-1 md:space-y-2 pr-2 md:pr-4 flex-1">
              <label className="text-xs md:text-base font-black block uppercase">3. Full Payment via bKash</label>
              <p className="text-[9px] md:text-sm text-muted-foreground leading-relaxed">Customers pay the entire order amount upfront via bKash.</p>
            </div>
            <div className="pt-1 md:pt-0 shrink-0">
              <ToggleSwitch checked={settings.fullBkash} onChange={() => handleToggle('fullBkash')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
