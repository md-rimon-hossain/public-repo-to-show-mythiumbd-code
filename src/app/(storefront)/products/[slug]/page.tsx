"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, FreeMode, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import { Heart, Minus, Plus, ShoppingCart, X, Ruler } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { IProduct } from "@/types";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, openCart } from "@/store/slices/cartSlice";
import { toggleWishlist } from "@/store/slices/wishlistSlice";
import { toast } from "sonner";
import { ProductCard } from "@/components/product/product-card";
import { ImageZoom } from "@/components/product/image-zoom";
import LoadingSpinnerIphone from "@/components/shared/loadingSpinerIphone";


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedColorHex, setSelectedColorHex] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const isFavorite = product ? wishlistItems.some((item: any) => item.productId === product._id) : false;

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.slug}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const fetchedProduct = data.data;
          setProduct(fetchedProduct);
          
          if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
            setSelectedSize(fetchedProduct.variants[0].size);
            if (fetchedProduct.variants[0].colors && fetchedProduct.variants[0].colors.length > 0) {
              setSelectedColor(fetchedProduct.variants[0].colors[0].colorName);
              setSelectedColorHex(fetchedProduct.variants[0].colors[0].colorHex);
            }
          }
          
          // Fetch related
          const categoryId = typeof fetchedProduct.category === 'object' ? fetchedProduct.category._id : fetchedProduct.category;
          if (categoryId) {
            const relRes = await fetch(`/api/products?category=${categoryId}&limit=4`);
            const relData = await relRes.json();
            setRelatedProducts(relData.data || []);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (params.slug) fetchProduct();
  }, [params.slug]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (sizeChartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sizeChartOpen]);

  if (loading) return <LoadingSpinnerIphone/>
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const selectedSizeVariant = product?.variants?.find((v: any) => v.size === selectedSize);
  const selectedColorVariant = selectedSizeVariant?.colors?.find((c: any) => c.colorName === selectedColor && c.colorHex === selectedColorHex) || selectedSizeVariant?.colors?.find((c: any) => c.colorName === selectedColor);
  
  let availableStock = product?.totalQuantity || 0;
  if (selectedSizeVariant) {
    availableStock = selectedSizeVariant.colors?.reduce((acc: number, c: any) => acc + (c.stock || 0), 0) || 0;
    if (selectedColorVariant) {
      availableStock = selectedColorVariant.stock || 0;
    }
  }

  const isOutOfStock = availableStock <= 0;
  const canAddToCart = selectedSize && selectedColor && !isOutOfStock;

  const handleAddToCart = (): boolean => {
    if (!selectedSize || !selectedColor) {
      toast.error("Please select a size and color");
      return false;
    }
    if (isOutOfStock) {
      toast.error("This variant is out of stock");
      return false;
    }
    const variant = product.variants.find((v) => v.size === selectedSize);
    const colorVar = variant?.colors.find((c) => c.colorName === selectedColor && c.colorHex === selectedColorHex) || variant?.colors.find((c) => c.colorName === selectedColor);
    
    dispatch(addToCart({
      productId: product._id,
      productName: product.name,
      productImage: product.images[0] || "",
      productSlug: product.slug,
      size: selectedSize,
      color: selectedColor,
      colorHex: colorVar?.colorHex || "#000000",
      quantity: quantity,
      regularPrice: product.regularPrice,
      discountPrice: product.discountPrice,
      maxStock: colorVar?.stock || 0
    }));
    toast.success("Added to cart");
    dispatch(openCart());
    return true;
  };

  const handleBuyNow = () => {
    if (handleAddToCart()) {
      router.push("/checkout");
    }
  };

  const hasSizeChart = product.sizeChartTitle || product.sizeChartDescription || product.sizeChartImage || product.fitAndStyle || product.howToMeasure;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title || product.name,
    "image": product.images || [],
    "description": product.description?.replace(new RegExp('<[^>]*>?', 'gm'), '') || product.name,
    "sku": product.variants?.[0]?.colors?.[0]?.sku || product._id,
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "priceCurrency": "BDT",
      "price": product.discountPrice || product.regularPrice,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    }
  };

  return (
    <div className="container mx-auto px-1 md:px-4 pb-6 md:pb-12 relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 mb-8 md:mb-20 items-start">
        {/* Left: Images & Video */}
        <div className="lg:col-span-7 flex flex-col gap-2 md:gap-4 min-w-0">
            <div className="bg-background border border-border shadow-sm p-1 md:p-2 overflow-hidden rounded-xl md:rounded-2xl group w-full relative hide-nav-on-mobile">
              <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 767px) {
                  .hide-nav-on-mobile .swiper-button-next,
                  .hide-nav-on-mobile .swiper-button-prev {
                    display: none !important;
                  }
                }
                .hide-nav-on-mobile .swiper-pagination-fraction {
                    position: absolute;
                    bottom: 12px;
                    left: 50% !important;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.6);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    width: auto !important;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    backdrop-filter: blur(4px);
                    z-index: 10;
                }
              `}} />
              <Swiper
                style={{ "--swiper-navigation-color": "#fff", "--swiper-pagination-color": "#fff" } as any}
                spaceBetween={10}
                navigation={true}
                pagination={{ type: "fraction" }}
                thumbs={{ swiper: thumbsSwiper }}
                modules={[FreeMode, Navigation, Thumbs, Pagination]}
                className="h-[280px] sm:h-[350px] md:h-[450px] w-full rounded-lg md:rounded-xl"
              >
                {product.video && (
                  <SwiperSlide key="video">
                    <div className="w-full h-full relative bg-black flex items-center justify-center rounded-lg md:rounded-xl overflow-hidden">
                      <video 
                        src={product.video} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </SwiperSlide>
                )}
                {product.images?.map((img, idx) => (
                  <SwiperSlide key={`img-${idx}`}>
                    <div className="w-full h-full relative">
                      <ImageZoom src={img} alt={product.title || product.name} className="w-full h-full" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className="thumbs-slider w-full"
            >
              {product.video && (
                <SwiperSlide key="video-thumb" className="cursor-pointer bg-background border border-border shadow-sm p-1 rounded-lg md:rounded-xl">
                  <div className="w-full h-12 sm:h-16 md:h-20 relative bg-black flex items-center justify-center rounded overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
                      <span className="text-white text-[8px] md:text-[10px] font-black tracking-widest px-1 md:px-2 py-0.5 md:py-1 border border-white/50 rounded backdrop-blur-sm">VIDEO</span>
                    </div>
                    <video src={product.video} className="w-full h-full object-cover opacity-70" />
                  </div>
                </SwiperSlide>
              )}
              {product.images?.map((img, idx) => (
                <SwiperSlide key={`img-thumb-${idx}`} className="cursor-pointer bg-background border border-border shadow-sm p-1 rounded-lg md:rounded-xl">
                  <div className="w-full h-12 sm:h-16 md:h-20 relative">
                    <Image src={img} alt="" fill className="object-cover rounded" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-5 flex flex-col pt-0 md:pt-2 relative lg:sticky lg:top-10 z-10 self-start">
          <div>
            <div className="inline-block px-2 sm:px-3 py-0.5 border-2 border-foreground font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-full mb-1 lg:mb-2">
              {typeof product.category === 'object' ? product.category.name : "Category"}
            </div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter [word-spacing:0.15em] leading-none mb-1 md:mb-3">{product.name}</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 lg:gap-4 mb-2 md:mb-4">
            <span className="text-lg lg:text-2xl font-black text-red-600 whitespace-nowrap">{formatPrice(product.discountPrice || product.regularPrice)}</span>
            {product.discountPrice && (
              <>
                <span className="text-xs sm:text-base lg:text-lg font-bold text-neutral-500 line-through whitespace-nowrap">{formatPrice(product.regularPrice)}</span>
                <span className="bg-black dark:bg-white text-white dark:text-black text-[9px] sm:text-[10px] lg:text-xs font-black uppercase px-1.5 py-0.5 tracking-wider shadow-sm whitespace-nowrap mt-1 sm:mt-0">
                  SAVE {Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* SIZE CHART Button */}
          {hasSizeChart && (
            <button
              type="button"
              onClick={() => setSizeChartOpen(true)}
              className="flex items-center gap-1 text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-widest mb-2 lg:mb-4 underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              <Ruler size={14} className="lg:w-[16px] lg:h-[16px]" />
              SIZE CHART
            </button>
          )}

          <div className="mb-4 lg:mb-5">
            <h3 className="font-black uppercase tracking-widest text-sm lg:text-base mb-2 lg:mb-3">Size</h3>
            <div className="flex gap-3 flex-wrap">
              {product.variants?.map(v => {
                const sizeStock = v.colors?.reduce((acc: number, c: any) => acc + (c.stock || 0), 0) || 0;
                const isSizeOutOfStock = sizeStock <= 0;
                return (
                <button
                  key={v.size}
                  onClick={() => {
                    setSelectedSize(v.size);
                    setSelectedColor("");
                    setSelectedColorHex("");
                    setQuantity(1);
                  }}
                  className={`min-w-[56px] lg:min-w-[64px] h-8 lg:h-9 px-4 border-2 flex items-center justify-center font-black text-xs lg:text-sm transition-all ${
                    selectedSize === v.size ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:border-foreground"
                  } ${isSizeOutOfStock ? "line-through text-neutral-500 opacity-50 bg-neutral-900/20 cursor-not-allowed" : ""}`}
                >
                  {v.size}
                </button>
                )
              })}
            </div>
          </div>

          {selectedSize && (
            <div className="mb-4 lg:mb-5 flex flex-row items-start gap-3 lg:gap-4">
              <h3 className="font-black uppercase tracking-widest text-sm lg:text-base shrink-0 m-0 mt-0.5 lg:mt-0">Color</h3>
              <div className="flex gap-1 lg:gap-1.5 flex-wrap items-center">
                {selectedSizeVariant?.colors.map((c: any, index: number) => {
                  const isColorOutOfStock = c.stock <= 0;
                  return (
                  <button
                    key={`${c.colorName}-${c.colorHex}-${index}`}
                    onClick={() => {
                      setSelectedColor(c.colorName);
                      setSelectedColorHex(c.colorHex);
                      setQuantity(1);
                    }}
                    title={`${c.colorName}${isColorOutOfStock ? ' - Out of Stock' : ''}`}
                    className={`shrink-0 flex items-center gap-1 px-1 py-0.5 lg:px-1.5 lg:py-0.5 rounded-full transition-all duration-200 ${
                      selectedColor === c.colorName && selectedColorHex === c.colorHex
                        ? "border-2 border-solid border-foreground bg-foreground/5" 
                        : "border-2 border-dotted border-neutral-300 dark:border-neutral-600 hover:border-foreground/50 opacity-80 hover:opacity-100"
                    } ${isColorOutOfStock ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    <span 
                      style={{ backgroundColor: c.colorHex }}
                      className="w-3 h-3 lg:w-3.5 lg:h-3.5 block rounded-full border border-black/20 dark:border-white/20 relative overflow-hidden shrink-0"
                    >
                      {isColorOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-[1px] bg-red-600 rotate-45 transform origin-center"></div>
                        </div>
                      )}
                    </span>
                    <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-foreground">{c.colorName}</span>
                  </button>
                  )})}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 lg:gap-6 mb-4 lg:mb-5">
            <div className="flex items-center border-2 border-border h-8 lg:h-9 shrink-0">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 lg:w-12 h-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <Minus size={14} className="lg:w-[14px] lg:h-[14px]" />
              </button>
              <span className="w-10 lg:w-12 text-center font-black text-base lg:text-lg">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(quantity + 1, availableStock))}
                disabled={isOutOfStock || quantity >= availableStock}
                className="w-10 lg:w-12 h-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} className="lg:w-[14px] lg:h-[14px]" />
              </button>
            </div>
            <span className="text-xs lg:text-base font-semibold">
              {isOutOfStock ? (
                <span className="text-red-500 uppercase tracking-widest font-black">Out of Stock</span>
              ) : (
                <span className="text-neutral-400">
                  {availableStock} items available {selectedColor ? "in this color" : selectedSize ? "in this size" : ""}
                </span>
              )}
            </span>
          </div>

          <button 
            onClick={handleBuyNow}
            className="group relative flex w-full mt-2 h-12 lg:h-14 items-center justify-center font-black uppercase tracking-widest text-xs sm:text-sm border-2 border-foreground bg-foreground text-background overflow-hidden transition-all duration-500 hover:shadow-xl"
          >
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-background group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
            <span className="relative z-10 group-hover:text-foreground transition-colors duration-500">BUY NOW</span>
          </button>

          <div className="flex gap-2 sm:gap-4 mt-3">
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs sm:text-sm border-2 transition-colors ${
                isOutOfStock ? "bg-neutral-300 text-neutral-500 border-neutral-300 cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-800" : "bg-transparent border-foreground text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <ShoppingCart size={18} className="lg:w-[20px] lg:h-[20px]" />
              {isOutOfStock ? "STOCK OUT" : "ADD TO CART"}
            </button>
            <button 
              onClick={() => dispatch(toggleWishlist({
                productId: product._id,
                productName: product.name,
                productImage: product.images[0] || "",
                productSlug: product.slug,
                regularPrice: product.regularPrice,
                discountPrice: product.discountPrice
              }))}
              className={`w-12 h-12 lg:w-14 lg:h-14 shrink-0 flex items-center justify-center border-2 transition-colors ${
                isFavorite 
                  ? "border-red-500 text-red-500 hover:bg-red-500/10" 
                  : "border-border text-foreground hover:border-red-500 hover:text-red-500"
              }`}
            >
              <Heart 
                size={18} 
                className={`lg:w-[20px] lg:h-[20px] transition-all ${isFavorite ? "fill-red-500" : ""}`} 
              />
            </button>
          </div>

          <button 
            onClick={() => {
              const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
              const message = `Hi! I am contacting you from your website. I have a question about the product: *${product.name}*\n\nHere is the link:\n${currentUrl}`;
              const whatsappUrl = `https://wa.me/8801817854326?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="flex w-full mt-3 h-12 lg:h-14 items-center justify-center gap-2 font-black uppercase tracking-widest text-xs sm:text-sm border-2 border-[#25D366] bg-[#25D366] text-white transition-all hover:bg-[#1EBE5C] hover:border-[#1EBE5C]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            Ask on WhatsApp
          </button>
        </div>

        {/* Bottom Left: Descriptions */}
        <div className="lg:col-span-7 flex flex-col gap-6 md:gap-12 min-w-0">
          {/* Product Description (Rich HTML) */}
          <section className="w-full md:px-6 lg:px-10">
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-widest mb-3 md:mb-6 border-b-2 border-border pb-2 md:pb-3">Product Description</h2>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-[13px] md:text-sm ml-5 md:ml-2
                [&_*]:!bg-transparent
                [&_p]:text-muted-foreground [&_li]:text-muted-foreground
                [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground
                [&_p]:mb-3 md:[&_p]:mb-4
                [&_h2]:text-base md:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 md:[&_h2]:mt-6 [&_h2]:mb-2 md:[&_h2]:mb-3
                [&_h3]:text-sm md:[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 md:[&_h3]:mt-4 [&_h3]:mb-1.5 md:[&_h3]:mb-2
                [&_ul]:list-disc [&_ul]:!pl-6 md:[&_ul]:!pl-8 [&_ol]:list-decimal [&_ol]:!pl-6 md:[&_ol]:!pl-8
                [&_li]:my-1 md:[&_li]:my-1.5
                [&_blockquote]:border-l-2 md:[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 md:[&_blockquote]:pl-4 [&_blockquote]:italic
                [&_a]:text-foreground [&_a]:underline
                [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </section>

          {/* Product Details — Fit & Style / How to Measure */}
          {(product.fitAndStyle || product.howToMeasure) && (
            <section className="w-full border-t-2 border-border pt-4 md:pt-8 md:px-6 lg:px-10">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-widest mb-3 md:mb-6">Product Details</h2>
              
              {product.fitAndStyle && (
                <div className="mb-6 md:mb-8">
                  <h3 className="text-sm md:text-lg font-bold mb-1.5 md:mb-3 uppercase tracking-widest">Fit & Style</h3>
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-[13px] md:text-sm ml-5 md:ml-2
                      [&_*]:!bg-transparent
                      [&_p]:text-muted-foreground [&_li]:text-muted-foreground
                      [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground
                      [&_p]:mb-3 md:[&_p]:mb-4
                      [&_ul]:list-disc [&_ul]:!pl-6 md:[&_ul]:!pl-8 [&_ol]:list-decimal [&_ol]:!pl-6 md:[&_ol]:!pl-8
                      [&_li]:my-1 md:[&_li]:my-1.5 [&_strong]:font-bold
                      [&_a]:text-foreground [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: product.fitAndStyle }}
                  />
                </div>
              )}

              {product.howToMeasure && (
                <div>
                  <h3 className="text-sm md:text-lg font-bold mb-1.5 md:mb-3">How to Measure</h3>
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-[13px] md:text-sm ml-5 md:ml-2
                      [&_*]:!bg-transparent
                      [&_p]:text-muted-foreground [&_li]:text-muted-foreground
                      [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground
                      [&_p]:mb-3 md:[&_p]:mb-4
                      [&_ul]:list-disc [&_ul]:!pl-6 md:[&_ul]:!pl-8 [&_ol]:list-decimal [&_ol]:!pl-6 md:[&_ol]:!pl-8
                      [&_li]:my-1 md:[&_li]:my-1.5 [&_strong]:font-bold
                      [&_a]:text-foreground [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: product.howToMeasure }}
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-8 md:py-12 border-t-2 border-border">
          <h2 className="text-xl md:text-3xl font-bold mb-6 md:mb-8 font-sans uppercase tracking-tighter text-foreground leading-none">You Might Also Love</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Chart Popup (Lightweight) */}
      {sizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSizeChartOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-background border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-xl">
            <div className="sticky top-0 bg-background/95 backdrop-blur z-10 flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Size Chart</h2>
              <button 
                onClick={() => setSizeChartOpen(false)}
                className="p-2 hover:bg-muted text-foreground rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Title & Description */}
              {(product.sizeChartTitle || product.sizeChartDescription) && (
                <div>
                  {product.sizeChartTitle && (
                    <h3 className="text-sm font-black uppercase tracking-wide mb-2 text-foreground">{product.sizeChartTitle}</h3>
                  )}
                  {product.sizeChartDescription && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{product.sizeChartDescription}</p>
                  )}
                </div>
              )}

              {(product.sizeChartTitle || product.sizeChartDescription) && <hr className="border-border" />}

              {/* Size Chart Image */}
              {product.sizeChartImage && (
                <div className="flex justify-center">
                  <div className="relative w-full">
                    <Image
                      src={product.sizeChartImage}
                      alt="Size Chart"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              )}

              {product.sizeChartImage && <hr className="border-border" />}

              {/* Fit & Style */}
              {product.fitAndStyle && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide mb-3 text-foreground">Fit & Style</h3>
                  <div 
                    className="prose prose-sm max-w-none text-foreground leading-relaxed [&_*]:!bg-transparent [&_*]:!text-foreground"
                    dangerouslySetInnerHTML={{ __html: product.fitAndStyle }}
                  />
                </div>
              )}

              {/* How to Measure */}
              {product.howToMeasure && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide mb-3 text-foreground">How to Measure</h3>
                  <div 
                    className="prose prose-sm max-w-none text-foreground leading-relaxed [&_*]:!bg-transparent [&_*]:!text-foreground"
                    dangerouslySetInnerHTML={{ __html: product.howToMeasure }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
