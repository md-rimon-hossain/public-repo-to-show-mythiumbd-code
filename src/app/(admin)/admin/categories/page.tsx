"use client";

import React, { useEffect, useState } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Plus, Edit, Trash2, Tag, Loader2, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const CATEGORY_TYPES = [
  { value: 'shirt', label: 'Shirt' },
  { value: 'half_shirt', label: 'Half Shirt' },
  { value: 'tshirt', label: 'T-Shirt' },
  { value: 'pant', label: 'Pant' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'custom', label: 'Custom' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ name: '', categoryType: 'tshirt', image: '', customSizes: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', categoryType: 'tshirt', image: '', customSizes: '' });
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      categoryType: cat.categoryType,
      image: cat.image,
      customSizes: cat.categoryType === 'custom' ? cat.sizes?.join(', ') : '',
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const res = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, folder: 'mythium/categories' }),
        });
        const data = await res.json();
        if (data.success) {
          setForm(f => ({ ...f, image: data.data.url.url }));
          toast.success('Image uploaded');
        } else {
          toast.error(data.message || 'Upload failed');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error('Upload failed');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.image) {
      toast.error('Name and image are required');
      return;
    }
    try {
      setSaving(true);
      const body: any = { name: form.name, categoryType: form.categoryType, image: form.image };
      if (form.categoryType === 'custom' && form.customSizes) {
        body.sizes = form.customSizes.split(',').map(s => s.trim()).filter(Boolean);
      }

      const url = editing ? `/api/categories/${editing._id}` : '/api/categories';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editing ? 'Category updated' : 'Category created');
        setShowModal(false);
        fetchCategories();
      } else {
        toast.error(data.errors?.[0]?.message || data.message || 'Failed');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Category deleted');
        setShowDeleteModal(null);
        fetchCategories();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-1 sm:mb-2 truncate">Categories</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-[9px] sm:text-xs md:text-sm uppercase tracking-wider sm:tracking-[0.2em] font-semibold truncate">Manage product categories and sizing groups.</p>
        </div>
        <button onClick={openCreate} className="px-3 sm:px-6 py-2 sm:py-3 border border-border font-bold text-[10px] sm:text-xs hover:bg-foreground hover:text-background transition-colors flex items-center gap-1.5 sm:gap-2 rounded-lg shrink-0">
          <Plus size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">New Category</span><span className="sm:hidden">New</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinnerIphone />
      ) : categories.length === 0 ? (
        <div className="border border-border bg-background rounded-xl p-12 text-center text-muted-foreground">
          <Tag size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold ">No categories yet</p>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Create your first category to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {categories.map((category) => (
            <div key={category._id} className="border border-border bg-background rounded-xl flex flex-row md:flex-col overflow-hidden shadow-sm">
              <div className="w-28 md:w-full md:h-40 bg-muted relative border-r md:border-r-0 md:border-b border-border shrink-0">
                {category.image && (
                  <Image src={category.image} alt={category.name} fill className="object-cover" />
                )}
              </div>
              
              <div className="p-3 md:p-5 flex-1 flex flex-col justify-between bg-background min-w-0">
                <div className="mb-2 md:mb-4">
                  <h3 className="text-base md:text-xl font-bold tracking-tighter text-foreground flex items-center gap-1.5 md:gap-2 mb-2 truncate">
                    <Tag size={14} className="text-foreground shrink-0 md:w-4 md:h-4" /> <span className="truncate">{category.name}</span>
                  </h3>
                  <div className="space-y-1.5 md:space-y-3">
                    <div className="flex justify-between items-center border-b border-border/10 pb-1.5 md:pb-2">
                      <span className="text-[9px] md:text-xs font-medium text-muted-foreground">TYPE</span>
                      <span className="text-[10px] md:text-xs font-bold text-foreground uppercase truncate pl-2">{category.categoryType?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/10 pb-1.5 md:pb-2">
                      <span className="text-[9px] md:text-xs font-medium text-muted-foreground">SIZES</span>
                      <span className="text-[10px] md:text-xs font-bold text-foreground uppercase truncate pl-2">{category.sizes?.join(', ') || 'NONE'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-xs font-medium text-muted-foreground">STATUS</span>
                      <span className={`px-1.5 py-0.5 md:px-2 md:py-1 border text-[8px] md:text-[9px] font-black tracking-widest uppercase rounded-sm ${category.isActive !== false ? 'border-border text-foreground bg-muted/30' : 'border-muted-foreground text-muted-foreground'}`}>
                        {category.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto pt-2 md:pt-4">
                  <button onClick={() => openEdit(category)} className="flex-1 py-1.5 md:py-2 border border-border rounded-md text-[10px] md:text-xs font-medium hover:border-foreground hover:bg-foreground hover:text-background transition-colors flex justify-center items-center gap-1.5">
                    <Edit size={12} className="md:w-[14px] md:h-[14px]" /> EDIT
                  </button>
                  <button onClick={() => setShowDeleteModal(category)} className="px-3 md:px-4 py-1.5 md:py-2 border border-red-500/20 rounded-md text-red-500 hover:border-red-500 hover:bg-red-500 hover:text-white transition-colors flex justify-center items-center">
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                  </button>
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
              <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground">{editing ? 'EDIT CATEGORY' : 'New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">CATEGORY NAME *</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest" placeholder="E.G. T-SHIRTS" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">CATEGORY TYPE *</label>
                <select className="w-full px-4 py-3 bg-background border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest appearance-none" value={form.categoryType} onChange={e => setForm({...form, categoryType: e.target.value})}>
                  {CATEGORY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              {form.categoryType === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">CUSTOM SIZES (COMMA SEPARATED)</label>
                  <input type="text" className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest" placeholder="E.G. ONE SIZE, S/M, L/XL" value={form.customSizes} onChange={e => setForm({...form, customSizes: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">CATEGORY IMAGE *</label>
                {form.image ? (
                  <div className="relative w-full h-40 border border-border overflow-hidden mb-2 bg-muted">
                    <Image src={form.image} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => setForm({...form, image: ''})} className="absolute top-2 right-2 p-2 bg-background border border-border text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-foreground transition-colors block">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploading ? (
                      <Loader2 className="animate-spin mx-auto text-foreground" size={24} />
                    ) : (
                      <>
                        <Upload className="mx-auto text-foreground mb-2" size={24} />
                        <p className="text-xs font-medium text-muted-foreground">CLICK TO UPLOAD IMAGE</p>
                      </>
                    )}
                  </label>
                )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowDeleteModal(null)}>
          <div className="border border-border bg-background rounded-xl p-6 lg:p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground mb-2">DELETE CATEGORY</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              Delete <span className="text-foreground font-black">{showDeleteModal.name}</span>? Products using this category may be affected.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(null)} className="px-6 py-3 border border-border font-semibold text-xs hover:border-foreground transition-colors">CANCEL</button>
              <button onClick={() => handleDelete(showDeleteModal._id)} disabled={deleting === showDeleteModal._id} className="px-6 py-3 border-2 border-red-500 bg-red-500/10 text-red-500 font-semibold text-xs hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50">
                {deleting === showDeleteModal._id && <Loader2 size={16} className="animate-spin" />}
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
