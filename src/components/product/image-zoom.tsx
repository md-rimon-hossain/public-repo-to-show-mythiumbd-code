"use client";

import { useState, useRef, MouseEvent, TouchEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
}

export function ImageZoom({ src, alt, className, zoomLevel = 3 }: ImageZoomProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (isMobile) return;
    if (!containerRef.current) return;
    
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;

    setPosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (!isMobile) setIsZooming(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile) setIsZooming(false);
  };

  const handleClick = () => {
    if (isMobile) {
      setIsModalOpen(true);
      setIsZooming(false);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-xl", 
          isMobile ? "cursor-pointer" : "cursor-crosshair", 
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMove}
        onClick={handleClick}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain transition-opacity duration-300"
          style={{ opacity: isZooming && !isMobile ? 0 : 1 }}
        />
        
        {isZooming && !isMobile && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${src})`,
              backgroundPosition: `${position.x}% ${position.y}%`,
              backgroundSize: `${zoomLevel * 100}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        
        {/* Lens indicator */}
        {isZooming && !isMobile && (
          <div
            className="absolute pointer-events-none border border-white/30 rounded-full bg-white/5 backdrop-blur-[1px] shadow-[0_0_0_9999px_rgba(0,0,0,0.1)]"
            style={{
              width: "150px",
              height: "150px",
              left: `calc(${position.x}% - 75px)`,
              top: `calc(${position.y}% - 75px)`,
            }}
          />
        )}

        {isMobile && (
          <div className="absolute bottom-2 right-2 bg-background/50 backdrop-blur-md p-2 rounded-full pointer-events-none text-foreground shadow-sm">
            <ZoomIn size={16} />
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          <div className="flex justify-end p-4 absolute top-0 right-0 z-[10000]">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={5}
              centerOnInit={true}
              wheel={{ wheelDisabled: false }}
              doubleClick={{ mode: "zoomIn" }}
              pinch={{ step: 5 }}
            >
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Image 
                  src={src} 
                  alt={alt} 
                  width={1200}
                  height={1200}
                  className="w-full h-full object-contain max-h-[100vh]" 
                  draggable={false}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
