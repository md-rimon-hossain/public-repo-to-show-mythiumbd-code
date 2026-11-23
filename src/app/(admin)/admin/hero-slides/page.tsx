"use client";

import React, { useEffect, useState } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Images, Plus, Edit, Trash2, Loader2, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ image: '', title: '', subtitle: '', ctaText: '', ctaLink: '', isActive: true, order: 0 });

  useEffect(() => { fetchSlides(); }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hero-slides?all=true');
      const data = await res.json();
      if (data.success) setSlides(data.data);
    } catch { toast.error('Failed to load slides'); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ image: '', title: '', subtitle: '', ctaText: '', ctaLink: '', isActive: true, order: slides.length });
    setShowModal(true);
  };

  const openEdit = (slide: any) => {
    setEditing(slide);
    setForm({ image: slide.image, title: slide.title || '', subtitle: slide.subtitle || '', ctaText: slide.ctaText || '', ctaLink: slide.ctaLink || '', isActive: slide.isActive, order: slide.order || 0 });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/upload/cloudinary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: reader.result, folder: 'mythium/hero-slides' }) });
        const data = await res.json();
        if (data.success) { setForm(f => ({ ...f, image: data.data.url.url })); toast.success('Image uploaded'); }
        else toast.error(data.message || 'Upload failed');
      } catch { toast.error('Upload failed'); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) { toast.error('Image is required'); return; }
    try {
      setSaving(true);
      const url = editing ? `/api/hero-slides/${editing._id}` : '/api/hero-slides';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast.success(editing ? 'Slide updated' : 'Slide created'); setShowModal(false); fetchSlides(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('An error occurred'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Slide deleted'); fetchSlides(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Failed'); } finally { setDeleting(null); }
  };

  const toggleActive = async (slide: any) => {
    try {
      setToggling(slide._id);
      const res = await fetch(`/api/hero-slides/${slide._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !slide.isActive }) });
      const data = await res.json();
      if (data.success) { toast.success(slide.isActive ? 'Slide deactivated' : 'Slide activated'); fetchSlides(); }
    } catch { toast.error('Failed'); } finally { setToggling(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-2">Hero Slides</h1>
          <p className="text-muted-foreground mt-2 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold">Manage homepage banner carousel.</p>
        </div>
        <button onClick={openCreate} className="px-6 py-3 border border-border font-semibold text-xs hover:bg-foreground hover:text-background transition-colors flex items-center gap-2 rounded-lg">
          <Plus size={16} /> Add Slide
        </button>
      </div>

      {loading ? (
        <LoadingSpinnerIphone />
      ) : slides.length === 0 ? (
        <div className="border border-border bg-background rounded-xl p-12 text-center text-muted-foreground">
          <Images size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold ">No hero slides yet. Add your first banner slide.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {slides.map((slide) => (
            <div key={slide._id} className="flex flex-col sm:flex-row border border-border bg-background rounded-xl group relative">
              <div className="w-full sm:w-1/3 h-48 sm:h-auto bg-muted/30 relative border-b sm:border-b-0 sm:border-r border-border">
                <Image src={slide.image} alt={slide.title || 'Slide'} fill className="object-cover" />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground mb-2">{slide.title || 'UNTITLED SLIDE'}</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">{slide.subtitle || ''}</p>
                  {slide.ctaText && (
                    <div className="inline-block px-4 py-2 border border-border bg-muted/30 text-[10px] font-black text-foreground uppercase ">
                      CTA: {slide.ctaText} → {slide.ctaLink || '#'}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-end mt-6">
                  <button onClick={() => toggleActive(slide)} disabled={toggling === slide._id} className="flex items-center gap-2 cursor-pointer border border-transparent hover:border-border p-2 -ml-2 transition-colors">
                    <div className="relative">
                      <div className={`block w-9 h-5 border-2 transition-colors ${slide.isActive ? 'bg-foreground border-foreground' : 'bg-transparent border-muted-foreground'}`}></div>
                      <div className={`absolute left-[2px] top-[2px] bg-background w-3 h-3 transition-transform ${slide.isActive ? 'transform translate-x-4' : 'bg-muted-foreground'}`}></div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{slide.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(slide)} className="px-4 py-2 border border-border font-semibold text-xs hover:border-foreground transition-colors flex items-center gap-2 rounded-lg">
                      <Edit size={16} /> EDIT
                    </button>
                    <button onClick={() => handleDelete(slide._id)} disabled={deleting === slide._id} className="px-4 py-2 border-2 border-red-500 bg-red-500/10 text-red-500 font-semibold text-xs hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50">
                      {deleting === slide._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="border border-border bg-background rounded-xl p-6 lg:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground">{editing ? 'EDIT SLIDE' : 'NEW SLIDE'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">SLIDE IMAGE *</label>
                {form.image ? (
                  <div className="relative w-full h-40 border border-border bg-muted/30 mb-2 group">
                    <Image src={form.image} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => setForm({...form, image: ''})} className="absolute top-2 right-2 p-2 bg-background border border-border text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><X size={16} /></button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-foreground/40 p-8 text-center cursor-pointer hover:border-foreground hover:bg-muted/20 transition-colors block">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploading ? <Loader2 className="animate-spin mx-auto text-foreground" size={24} /> : <><Upload className="mx-auto text-muted-foreground mb-2" size={24} /><p className="text-xs font-medium text-muted-foreground">UPLOAD IMAGE (16:9 RECOMMENDED)</p></>}
                  </label>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">TITLE</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest" placeholder="E.G. WINTER COLLECTION 2024" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">SUBTITLE</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest" placeholder="E.G. STAY WARM IN STYLE" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">CTA TEXT</label>
                  <input type="text" className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest" placeholder="E.G. SHOP NOW" value={form.ctaText} onChange={e => setForm({...form, ctaText: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">CTA LINK</label>
                  <input type="text" className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors" placeholder="e.g. /products" value={form.ctaLink} onChange={e => setForm({...form, ctaLink: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-border font-semibold text-xs hover:border-foreground transition-colors">CANCEL</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 border border-border bg-foreground text-background font-semibold text-xs hover:bg-transparent hover:text-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editing ? 'UPDATE' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
