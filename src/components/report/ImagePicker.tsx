"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, X } from "lucide-react";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3;

interface PickedImage {
  file: File;
  previewUrl: string;
}

export function ImagePicker({
  onChange,
}: {
  onChange: (files: File[]) => void;
}) {
  const [images, setImages] = useState<PickedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      for (const img of images) URL.revokeObjectURL(img.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const incoming = Array.from(fileList);
    const room = MAX_FILES - images.length;

    if (room <= 0) {
      setError(`แนบได้สูงสุด ${MAX_FILES} รูป`);
      return;
    }

    const accepted: PickedImage[] = [];
    for (const file of incoming.slice(0, room)) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (accepted.length > 0) {
      const next = [...images, ...accepted];
      setImages(next);
      onChange(next.map((img) => img.file));
    }
  }

  function removeAt(index: number) {
    const target = images[index];
    URL.revokeObjectURL(target.previewUrl);
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    onChange(next.map((img) => img.file));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2.5">
        <AnimatePresence>
          {images.map((img, index) => (
            <motion.div
              key={img.previewUrl}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={`รูปที่แนบ ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="ลบรูปนี้"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {images.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 text-neutral-400 transition hover:border-blue-400 hover:text-blue-500"
          >
            <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-[11px]">เพิ่มรูป</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
        แนบได้สูงสุด {MAX_FILES} รูป (JPG, PNG, WebP ไม่เกิน 5MB ต่อไฟล์)
      </p>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
          className="text-xs text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
