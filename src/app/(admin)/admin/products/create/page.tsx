"use client";

import React, { useState, useEffect, Suspense } from 'react';
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { 
  Package, Link as LinkIcon, Image as ImageIcon, Video, FileText, CheckCircle, Plus, Trash2, X, Info, Upload, Loader2, ListTree, DollarSign, Tag, Settings, Ruler
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

type ColorVariant = {
  colorName: string;
  colorHex: string;
  stock: number;
  sku: string;
};

type SizeVariant = {
  size: string;
  enabled: boolean;
  colors: ColorVariant[];
};

function ProductForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!editId);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    category: '',
    video: '',
    regularPrice: '',
    discountPrice: '',
    status: 'active',
    isTrending: false,
    sizeChartImage: '',
    sizeChartTitle: '',
    sizeChartDescription: '',
    fitAndStyle: '',
    howToMeasure: '',
  });

  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);

  useEffect(() => {
    fetchCategories();
    if (editId) fetchProduct(editId);
  }, [editId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch { toast.error('Failed to load categories'); }
  };

  const fetchProduct = async (id: string) => {
    try {
      setInitialLoading(true);
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.success) {
        const p = data.data;
        setFormData({
          name: p.name || '',
          title: p.title || '',
          description: p.description || '',
          category: typeof p.category === 'object' ? p.category._id : p.category,
          video: p.video || '',
          regularPrice: String(p.regularPrice || ''),
          discountPrice: String(p.discountPrice || ''),
          status: p.status || 'active',
          isTrending: p.isTrending || false,
          sizeChartImage: p.sizeChartImage || '',
          sizeChartTitle: p.sizeChartTitle || '',
          sizeChartDescription: p.sizeChartDescription || '',
          fitAndStyle: p.fitAndStyle || '',
          howToMeasure: p.howToMeasure || '',
        });
        setKeywords(p.keywords || []);
        setImages(p.images || []);
        
        if (p.variants && p.variants.length > 0) {
          const loadedSizes: SizeVariant[] = p.variants.map((v: any) => ({
            size: v.size,
            enabled: true,
            colors: v.colors.map((c: any) => ({
              colorName: c.colorName,
              colorHex: c.colorHex,
              stock: c.stock,
              sku: c.sku || ''
            }))
          }));
          setSizeVariants(loadedSizes);
        }
      }
    } catch { toast.error('Failed to load product'); } finally { setInitialLoading(false); }
  };

  const selectedCategoryObj = categories.find(c => c._id === formData.category);
  const availableSizes = selectedCategoryObj?.sizes?.length > 0 ? selectedCategoryObj.sizes : ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

  const toggleSize = (sizeName: string) => {
    const existingIndex = sizeVariants.findIndex(s => s.size === sizeName);
    if (existingIndex >= 0) {
      const updated = [...sizeVariants];
      updated[existingIndex].enabled = !updated[existingIndex].enabled;
      if (!updated[existingIndex].enabled) {
        updated[existingIndex].colors = [];
      } else if (updated[existingIndex].colors.length === 0) {
        updated[existingIndex].colors.push({ colorName: 'Black', colorHex: '#000000', stock: 0, sku: '' });
      }
      setSizeVariants(updated);
    } else {
      setSizeVariants([...sizeVariants, { size: sizeName, enabled: true, colors: [{ colorName: 'Black', colorHex: '#000000', stock: 0, sku: '' }] }]);
    }
  };

  const addColorToSize = (sizeIndex: number) => {
    const updated = [...sizeVariants];
    updated[sizeIndex].colors.push({ colorName: 'White', colorHex: '#FFFFFF', stock: 0, sku: '' });
    setSizeVariants(updated);
  };

  const updateColor = (sizeIndex: number, colorIndex: number, field: keyof ColorVariant, value: any) => {
    const updated = [...sizeVariants];
    updated[sizeIndex].colors[colorIndex] = {
      ...updated[sizeIndex].colors[colorIndex],
      [field]: field === 'stock' ? Number(value) : value
    };
    setSizeVariants(updated);
  };

  const removeColor = (sizeIndex: number, colorIndex: number) => {
    const updated = [...sizeVariants];
    updated[sizeIndex].colors.splice(colorIndex, 1);
    setSizeVariants(updated);
  };

  const totalStock = sizeVariants.reduce((sum, size) => {
    return sum + size.colors.reduce((cSum, color) => cSum + (Number(color.stock) || 0), 0);
  }, 0);

  const calculateDiscount = () => {
    const rp = Number(formData.regularPrice);
    const dp = Number(formData.discountPrice);
    if (rp && dp && rp > dp) {
      const saved = rp - dp;
      const percentage = ((saved / rp) * 100).toFixed(0);
      return { saved, percentage };
    }
    return null;
  };
  const discountInfo = calculateDiscount();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const res = await fetch('/api/upload/cloudinary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: reader.result, folder: 'mythium/products', resourceType: 'image' }),
              });
              const data = await res.json();
              if (data.success) {
                newImages.push(data.data.url.url ? data.data.url.url : data.data.url);
              } else {
                toast.error(data.message || `Upload failed for image ${i + 1}`);
              }
              resolve(true);
            } catch (err) {
              toast.error(`Upload failed for image ${i + 1}`);
              resolve(false);
            }
          };
          reader.onerror = () => {
            toast.error(`Failed to read file ${i + 1}`);
            resolve(false);
          };
          reader.readAsDataURL(file);
        });
      }
      
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
        toast.success(`Successfully uploaded ${newImages.length} image(s)`);
      }
    } catch {
      toast.error('Upload process failed');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingVideo(true);
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload/cloudinary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: reader.result, folder: 'mythium/products', resourceType: 'video' }),
          });
          const data = await res.json();
          if (data.success) {
            const url = data.data.url.url ? data.data.url.url : data.data.url;
            setFormData(prev => ({...prev, video: url}));
            toast.success('Video uploaded successfully');
          } else {
            toast.error(data.message || 'Video upload failed');
          }
        } catch (err) {
          toast.error('Video upload failed');
        } finally {
          setUploadingVideo(false);
          e.target.value = '';
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read video file');
        setUploadingVideo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Upload process failed');
      setUploadingVideo(false);
    }
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()]);
      }
      setKeywordInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 && !formData.video) { toast.error('At least one image or video is required'); return; }
    
    const activeVariants = sizeVariants.filter(s => s.enabled);
    if (activeVariants.length === 0) { toast.error('At least one size variant is required'); return; }

    const body = {
      name: formData.name,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      video: formData.video || undefined,
      regularPrice: Number(formData.regularPrice),
      discountPrice: Number(formData.discountPrice),
      status: formData.status,
      isTrending: formData.isTrending,
      sizeChartImage: formData.sizeChartImage || undefined,
      sizeChartTitle: formData.sizeChartTitle || undefined,
      sizeChartDescription: formData.sizeChartDescription || undefined,
      fitAndStyle: formData.fitAndStyle || undefined,
      howToMeasure: formData.howToMeasure || undefined,
      keywords,
      images,
      variants: activeVariants,
    };

    try {
      setLoading(true);
      const url = editId ? `/api/products/${editId}` : '/api/products';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(editId ? 'Product updated successfully!' : 'Product created successfully!');
        router.push('/admin/products');
      } else {
        toast.error(data.errors?.[0]?.message || data.message || 'Failed to save product');
      }
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="py-20"><LoadingSpinnerIphone /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 px-2 sm:px-4 md:px-0 pt-2 md:pt-0">
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 border-b-2 border-border pb-4 sm:pb-5 md:pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none mb-1 md:mb-2">
            {editId ? 'Edit Product' : 'Create New Product'}
          </h1>
          <p className="text-[9px] sm:text-[10px] md:text-sm uppercase tracking-wider md:tracking-[0.2em] font-semibold text-muted-foreground mt-1 md:mt-2">
            Complete the details below to {editId ? 'update the' : 'add a new'} product in your catalog.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Step 1: Basic Information */}
        <section className="bg-background border border-border shadow-sm rounded-xl p-3 sm:p-4 md:p-8 space-y-3 sm:space-y-4 md:space-y-6">
          <h2 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2 md:gap-3 mb-3 md:mb-4 border-b-2 border-border pb-2 sm:pb-3 md:pb-4">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded bg-foreground text-background text-[10px] sm:text-xs md:text-sm shrink-0">1</span>
            General Information
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Short Name *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full" 
                  placeholder="e.g. Cotton Polo"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <p className="text-xs text-muted-foreground/70 mt-1">Used for URL slugs and internal tags.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Full Title *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full" 
                  placeholder="e.g. Premium Cotton Polo Shirt"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
                <p className="text-xs text-muted-foreground/70 mt-1">The main title displayed to customers.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Description * <span className="text-xs text-muted-foreground/70">(Rich text — use the toolbar to format)</span></label>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData({...formData, description: html})}
                placeholder="Describe the product details, material, fit, features..."
                minHeight="220px"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Category Selection */}
        <section className="bg-background border border-border shadow-sm rounded-xl p-3 sm:p-4 md:p-8 space-y-3 sm:space-y-4 md:space-y-6">
          <h2 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2 md:gap-3 mb-3 md:mb-4 border-b-2 border-border pb-2 sm:pb-3 md:pb-4">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded bg-foreground text-background text-[10px] sm:text-xs md:text-sm shrink-0">2</span>
            Category & Variants
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Product Category *</label>
              <select 
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full appearance-none bg-gray-900/50"
                required
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="" disabled>Select a Category...</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground/70 mt-1">Select a category first to load available size options.</p>
            </div>

            {formData.category && (
              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-muted-foreground mb-3">Available Sizes for this Category</label>
                <div className="flex flex-wrap gap-3 mb-6">
                  {availableSizes.map((size: string) => {
                    const isEnabled = sizeVariants.find(s => s.size === size)?.enabled || false;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-4 py-2 rounded-xl border-2 transition-all font-bold ${
                          isEnabled 
                            ? 'bg-foreground border-foreground text-background' 
                            : 'bg-background border-border text-foreground hover:border-foreground'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-6">
                  {sizeVariants.filter(s => s.enabled).map((size) => {
                    const actualIdx = sizeVariants.findIndex(sv => sv.size === size.size);
                    return (
                      <div key={size.size} className="bg-muted/10 border border-border shadow-sm p-4 rounded-xl relative">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            Size <span className="bg-foreground text-background px-2 py-0.5 rounded uppercase tracking-widest text-xs">{size.size}</span>
                          </h3>
                          <button type="button" onClick={() => addColorToSize(actualIdx)} className="text-xs uppercase tracking-widest font-bold flex items-center gap-1 text-background bg-foreground px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity">
                            <Plus size={16} /> Add Color / Stock
                          </button>
                        </div>

                        <div className="space-y-3">
                          {size.colors.map((color, cIdx) => (
                            <div key={cIdx} className="grid grid-cols-12 gap-3 items-center bg-muted/30 p-3 rounded-lg border border-border">
                              <div className="col-span-12 md:col-span-3">
                                <label className="text-xs text-muted-foreground/70 block mb-1">Color Name</label>
                                <input 
                                  type="text" 
                                  required
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full py-1.5 text-sm" 
                                  placeholder="e.g. Navy Blue"
                                  value={color.colorName}
                                  onChange={e => updateColor(actualIdx, cIdx, 'colorName', e.target.value)}
                                />
                              </div>
                              <div className="col-span-6 md:col-span-2">
                                <label className="text-xs text-muted-foreground/70 block mb-1">Hex Code</label>
                                <div className="flex items-center gap-2 h-[34px]">
                                  <input 
                                    type="color" 
                                    className="h-8 w-8 rounded cursor-pointer bg-transparent border-0 shrink-0"
                                    value={color.colorHex}
                                    onChange={e => updateColor(actualIdx, cIdx, 'colorHex', e.target.value)}
                                  />
                                  <span className="text-xs text-muted-foreground font-mono truncate">{color.colorHex}</span>
                                </div>
                              </div>
                              <div className="col-span-6 md:col-span-2">
                                <label className="text-xs text-muted-foreground/70 block mb-1">Stock Qty</label>
                                <input 
                                  type="number" 
                                  required
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full py-1.5 text-sm" 
                                  placeholder="0"
                                  min="0"
                                  value={color.stock}
                                  onChange={e => updateColor(actualIdx, cIdx, 'stock', e.target.value)}
                                />
                              </div>
                              <div className="col-span-10 md:col-span-4">
                                <label className="text-xs text-muted-foreground/70 block mb-1">SKU (Optional)</label>
                                <input 
                                  type="text" 
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full py-1.5 text-sm" 
                                  placeholder={`Auto-generated if empty`}
                                  value={color.sku}
                                  onChange={e => updateColor(actualIdx, cIdx, 'sku', e.target.value)}
                                />
                              </div>
                              <div className="col-span-2 md:col-span-1 flex justify-end mt-4 md:mt-0">
                                <button 
                                  type="button" 
                                  onClick={() => removeColor(actualIdx, cIdx)}
                                  className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {size.colors.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground/70 text-sm border border-dashed border-border rounded-lg">
                              No colors added for this size. Customers won't be able to purchase it.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {sizeVariants.some(s => s.enabled) && (
                  <div className="mt-6 p-4 rounded-xl border border-border flex justify-between items-center bg-foreground text-background shadow-lg">
                    <span className="font-bold uppercase tracking-widest text-sm text-background">Total Calculated Stock:</span>
                    <span className="text-2xl font-black">{totalStock} <span className="text-sm font-bold uppercase tracking-widest text-background/80">units</span></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Media */}
        <section className="bg-background border border-border shadow-sm rounded-xl p-3 sm:p-4 md:p-8 space-y-3 sm:space-y-4 md:space-y-6">
          <h2 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2 md:gap-3 mb-3 md:mb-4 border-b-2 border-border pb-2 sm:pb-3 md:pb-4">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded bg-foreground text-background text-[10px] sm:text-xs md:text-sm shrink-0">3</span>
            Media Upload
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">Product Images</label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 border border-border group">
                      <Image src={img} alt="" fill className="object-cover" />
                      <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1.5 bg-foreground/60 backdrop-blur-md rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                {uploading ? (
                  <Loader2 className="animate-spin text-purple-400 mb-2" size={28} />
                ) : (
                  <>
                    <Upload className="text-muted-foreground mb-3" size={28} />
                    <p className="text-sm font-medium text-muted-foreground">Click to upload images</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Select multiple PNG/JPGs up to 5MB</p>
                  </>
                )}
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">Product Video</label>
              {formData.video && formData.video.includes('cloudinary') && (
                <div className="relative w-full aspect-video mb-4 rounded-xl overflow-hidden border border-border group bg-black">
                   <video src={formData.video} controls className="w-full h-full object-contain" />
                   <button type="button" onClick={() => setFormData({...formData, video: ''})} className="absolute top-2 right-2 p-1.5 bg-foreground/60 backdrop-blur-md rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={14} /></button>
                </div>
              )}
              
              {!formData.video || !formData.video.includes('cloudinary') ? (
                <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px] mb-4">
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  {uploadingVideo ? (
                    <Loader2 className="animate-spin text-purple-400 mb-2" size={28} />
                  ) : (
                    <>
                      <Video className="text-muted-foreground mb-3" size={28} />
                      <p className="text-sm font-medium text-muted-foreground">Click to upload video</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">MP4, WebM up to 50MB</p>
                    </>
                  )}
                </label>
              ) : null}

              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon size={18} className="text-muted-foreground/70" />
                </div>
                <input 
                  type="url" 
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full pl-10" 
                  placeholder="Or paste a YouTube/Vimeo link..."
                  value={formData.video}
                  onChange={e => setFormData({...formData, video: e.target.value})}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Pricing & Status */}
        <section className="bg-background border border-border shadow-sm rounded-xl p-3 sm:p-4 md:p-8 space-y-3 sm:space-y-4 md:space-y-6">
          <h2 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2 md:gap-3 mb-3 md:mb-4 border-b-2 border-border pb-2 sm:pb-3 md:pb-4">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded bg-foreground text-background text-[10px] sm:text-xs md:text-sm shrink-0">4</span>
            Pricing & Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Regular Price (৳) *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full" 
                  placeholder="0.00"
                  value={formData.regularPrice}
                  onChange={e => setFormData({...formData, regularPrice: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Discount Price (৳) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full" 
                  placeholder="0.00"
                  value={formData.discountPrice}
                  onChange={e => setFormData({...formData, discountPrice: e.target.value})}
                />
                <p className="text-xs text-muted-foreground/70 mt-1">Set equal to Regular Price if no discount.</p>
              </div>
              {discountInfo && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                  <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-amber-400 font-medium">Customer saves ৳{discountInfo.saved.toFixed(2)}</p>
                    <p className="text-xs text-amber-500/70">{discountInfo.percentage}% discount applied automatically</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Visibility Status</label>
                <select 
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full appearance-none bg-gray-900/50"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={formData.isTrending}
                      onChange={e => setFormData({...formData, isTrending: e.target.checked})}
                    />
                    <div className={`block w-12 h-7 rounded-full transition-colors ${formData.isTrending ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-background w-5 h-5 rounded-full transition-transform ${formData.isTrending ? 'transform translate-x-5' : ''}`}></div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground block">Mark as Trending</span>
                    <span className="text-xs text-muted-foreground">Highlight this product in the Trending section.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Step 5: SEO */}
        <section className="bg-background border border-border shadow-sm rounded-xl p-3 sm:p-4 md:p-8 space-y-3 sm:space-y-4 md:space-y-6">
          <h2 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2 md:gap-3 mb-3 md:mb-4 border-b-2 border-border pb-2 sm:pb-3 md:pb-4">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded bg-foreground text-background text-[10px] sm:text-xs md:text-sm shrink-0">5</span>
            Search Engine Optimization (SEO)
          </h2>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Search Keywords</label>
            <div className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all min-h-[52px] p-2 flex flex-wrap gap-2 items-center focus-within:ring-2 ring-blue-500/50">
              {keywords.map(kw => (
                <span key={kw} className="bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs py-1.5 px-3 rounded-full flex items-center gap-1.5">
                  {kw}
                  <X size={12} className="cursor-pointer hover:text-foreground transition-colors" onClick={() => setKeywords(keywords.filter(k => k !== kw))} />
                </span>
              ))}
              <input 
                type="text" 
                className="bg-transparent border-0 outline-none text-sm flex-1 min-w-[120px] text-foreground p-1"
                placeholder="Type a keyword and press Enter..."
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
              />
            </div>
            <p className="text-xs text-muted-foreground/70 mt-2">Help customers find this product by adding relevant search terms (e.g. "summer t-shirt", "cotton polo"). Max 20.</p>
          </div>
        </section>

        {/* Step 6: Size Chart & Fit Info */}
        <section className="bg-background border border-border shadow-sm rounded-xl p-3 sm:p-4 md:p-8 space-y-3 sm:space-y-4 md:space-y-6">
          <h2 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2 md:gap-3 mb-3 md:mb-4 border-b-2 border-border pb-2 sm:pb-3 md:pb-4">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded bg-foreground text-background text-[10px] sm:text-xs md:text-sm shrink-0">6</span>
            Size Chart & Fit Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Size Chart Title</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full" 
                placeholder="e.g. THE ARCHIVE FIT"
                value={formData.sizeChartTitle}
                onChange={e => setFormData({...formData, sizeChartTitle: e.target.value})}
              />
              <p className="text-xs text-muted-foreground/70 mt-1">Title shown at the top of the size chart modal.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Size Chart Description</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all w-full resize-none" 
                placeholder="e.g. Boxy. Heavy. Iconic. Our tees are cut for a signature vintage drape..."
                value={formData.sizeChartDescription}
                onChange={e => setFormData({...formData, sizeChartDescription: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">Size Chart Image</label>
            {formData.sizeChartImage && (
              <div className="relative w-full max-w-md h-48 mb-4 rounded-xl overflow-hidden border border-border group">
                <Image src={formData.sizeChartImage} alt="Size Chart" fill className="object-contain bg-background" />
                <button type="button" onClick={() => setFormData({...formData, sizeChartImage: ''})} className="absolute top-2 right-2 p-1.5 bg-foreground/60 backdrop-blur-md rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            )}
            <label className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[100px]">
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploadingSizeChart(true);
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const res = await fetch('/api/upload/cloudinary', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ file: reader.result, folder: 'mythium/size-charts' }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      const url = data.data.url.url ? data.data.url.url : data.data.url;
                      setFormData(prev => ({...prev, sizeChartImage: url}));
                      toast.success('Size chart image uploaded');
                    } else {
                      toast.error(data.message || 'Upload failed');
                    }
                    setUploadingSizeChart(false);
                  };
                  reader.readAsDataURL(file);
                } catch {
                  setUploadingSizeChart(false);
                  toast.error('Upload failed');
                }
              }} />
              {uploadingSizeChart ? (
                <Loader2 className="animate-spin text-cyan-400 mb-2" size={24} />
              ) : (
                <>
                  <Upload className="text-muted-foreground mb-2" size={24} />
                  <p className="text-sm font-medium text-muted-foreground">Upload size chart image</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">This image shows the size measurement table/guide</p>
                </>
              )}
            </label>
          </div>

          <div className="border-t border-border pt-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Fit & Style <span className="text-xs text-muted-foreground/70">(Rich text)</span></label>
            <RichTextEditor
              value={formData.fitAndStyle}
              onChange={(html) => setFormData({...formData, fitAndStyle: html})}
              placeholder="e.g. True Oversized Fit: Designed with a boxy silhouette and dropped shoulders..."
              minHeight="150px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">How to Measure <span className="text-xs text-muted-foreground/70">(Rich text)</span></label>
            <RichTextEditor
              value={formData.howToMeasure}
              onChange={(html) => setFormData({...formData, howToMeasure: html})}
              placeholder="e.g. Chest: Measure across the chest from armpit to armpit..."
              minHeight="150px"
            />
          </div>
        </section>

        {/* Submit */}
        <div className="pt-4 pb-12">
          <button 
            type="submit" 
            disabled={loading}
            className="group relative w-full h-16 inline-flex items-center justify-center gap-3 text-lg font-black tracking-widest uppercase border-2 border-foreground bg-foreground text-background overflow-hidden transition-all shadow-xl disabled:opacity-50"
          >
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
            <span className="relative z-10 flex items-center gap-3 group-hover:text-foreground transition-colors duration-300">
              {loading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
              {editId ? 'Save Changes' : 'Publish Product'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div className="py-20 max-w-sm mx-auto"><LoadingSpinnerIphone /></div>}>
      <ProductForm />
    </Suspense>
  );
}
