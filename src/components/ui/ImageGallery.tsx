"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryImage {
  id: string;
  url: string;
}

// Thumbnail grid; tapping one opens the full image in a fullscreen viewer.
export function ImageGallery({
  images,
  alt,
  thumbClassName = "h-20 w-20",
}: {
  images: GalleryImage[];
  alt: string;
  thumbClassName?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, step]);

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`ดูรูปเต็ม ${i + 1} จาก ${images.length}`}
            className={`relative shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 transition hover:opacity-90 ${thumbClassName}`}
          >
            <Image src={img.url} alt={alt} fill sizes="120px" className="object-cover" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={close}
          >
            <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
              <Image
                src={images[openIndex].url}
                alt={alt}
                fill
                sizes="100vw"
                className="object-contain p-2 sm:p-8"
                priority
              />
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="ปิด"
              autoFocus
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="รูปก่อนหน้า"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="รูปถัดไป"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={2} />
                </button>
                <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur">
                  {openIndex + 1} / {images.length}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
