"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";
import LoadingSpinnerIphone from "../shared/loadingSpinerIphone";


interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function HeroSlider({ initialSlides }: { initialSlides?: Slide[] } = {}) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides && initialSlides.length > 0 ? initialSlides : []);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialSlides || initialSlides.length === 0);

  useEffect(() => {
    setMounted(true);
    if (initialSlides && initialSlides.length > 0) return;
    fetch("/api/hero-slides")
      .then((res) => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setSlides(json.data);
        } else if (Array.isArray(json)) {
          setSlides(json);
        }
      })
      .catch(() => {
        // Fallback
        setSlides([
          {
            id: "1",
            image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=2000",
            title: "Summer Collection",
            subtitle: "Redefining modern aesthetics.",
            ctaText: "Shop Now",
            ctaLink: "/products?category=summer",
          },
          {
            id: "2",
            image: "https://images.unsplash.com/photo-1550614000-4b95d466f1fc?q=80&w=2000",
            title: "Urban Techwear",
            subtitle: "Engineered for the future.",
            ctaText: "Explore",
            ctaLink: "/products?category=techwear",
          },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [initialSlides]);

  if (!mounted || isLoading) return <LoadingSpinnerIphone/>

  if (slides.length === 0) return <></>;

  return (
    <div className="relative w-full aspect-[2/1] overflow-hidden group bg-neutral-900">
      <Swiper
        modules={[Autoplay, Pagination]}
        speed={1000}
        grabCursor={true}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, renderBullet: (index, className) => `<span class="${className} glass-bullet"></span>` }}
        loop={true}
        className="w-full h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            {({ isActive }) => (
              <div className="relative w-full h-full">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                
                
                <div className="absolute inset-0 flex items-end justify-start p-3 pb-8 md:p-16 text-left z-10">
                  <div className="w-full max-w-xl">
                    <div className="overflow-hidden p-1 -m-1 md:p-2 md:-m-2 flex flex-col items-start">
                        <h2 className={`transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} text-xl md:text-7xl font-black uppercase tracking-tighter text-white mb-0.5 md:mb-2 leading-none drop-shadow-sm`}>
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className={`transition-all duration-1000 delay-100 ease-[cubic-bezier(0.25,0.1,0.25,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} text-[8px] md:text-sm text-white mb-2 md:mb-6 font-bold tracking-[0.2em] uppercase drop-shadow-sm`}>
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.ctaText && slide.ctaLink && (
                          <div className={`transition-all duration-1000 delay-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} inline-block mt-1 md:mt-4`}>
                            <Link href={slide.ctaLink}>
                              <button className="group relative inline-flex items-center justify-center px-4 md:px-10 py-1.5 md:py-4 text-[8px] md:text-sm font-bold tracking-widest text-black uppercase bg-white rounded-full overflow-hidden border border-white transition-all duration-500 hover:shadow-xl">
                                <span className="absolute inset-0 w-full h-full -translate-x-full bg-black group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></span>
                                <span className="relative z-10 group-hover:text-white transition-colors duration-500">{slide.ctaText}</span>
                              </button>
                            </Link>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
        
      </Swiper>
      <style jsx global>{`
        .glass-bullet {
          background: rgba(255, 255, 255, 0.4) !important;
          width: 8px !important;
          height: 8px !important;
          opacity: 1 !important;
          border-radius: 9999px !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .swiper-pagination-bullet-active.glass-bullet {
          background: #ffffff !important;
          width: 32px !important;
        }
        @keyframes ios-spinner-fade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
