"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface SignaturePick {
  _id: string;
  image: string;
  link?: string;
}

export function SignaturePicksSection({ initialImages }: { initialImages?: SignaturePick[] } = {}) {
  const [images, setImages] = useState<SignaturePick[]>(initialImages && initialImages.length > 0 ? initialImages : []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialImages && initialImages.length > 0) return;
    fetch("/api/signature-picks")
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setImages(json.data);
        }
      })
      .catch(console.error);
  }, [initialImages]);

  if (images.length === 0) return null;

  return (
    <section className="py-4">
      <div className="container mx-auto md:px-6">
        <div className="flex justify-center items-center mb-2 md:mb-4 border-b border-border pb-2 md:pb-3 px-4 md:px-0">
          <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-foreground leading-none text-center">
            SIGNATURE PICKS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 w-full">
          {images.map((img) => {
            const href = img.link ? img.link : "/products";
            return (
              <Link key={img._id} href={href} className="block group relative overflow-hidden  bg-muted/30 border border-border">
                <Image
                  src={img.image}
                  alt="SIGNATURE PICKS"
                  width={800}
                  height={800}
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

