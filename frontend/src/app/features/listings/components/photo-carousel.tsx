"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  order: number;
}

interface PhotoCarouselProps {
  photos: Photo[];
  title: string;
  apiUrl?: string;
}

export function PhotoCarousel({ photos, title, apiUrl = "http://localhost:4000" }: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-muted">
        <ImageOff className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  function prev() {
    setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1));
  }

  function next() {
    setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1));
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Main image */}
      <div className="relative aspect-[16/9] w-full bg-muted">
        <Image
          src={`${apiUrl}${photos[current].url}`}
          alt={`${title} — photo ${current + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover transition-opacity duration-300"
          priority={current === 0}
        />

        {/* Counter */}
        <span className="absolute bottom-4 right-4 rounded-full bg-foreground/70 px-3 py-1 text-xs text-background">
          {current + 1} / {photos.length}
        </span>

        {/* Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 hover:bg-background transition-colors shadow-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 hover:bg-background transition-colors shadow-md"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setCurrent(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === current ? "border-secondary" : "border-transparent"
              }`}
            >
              <Image
                src={`${apiUrl}${photo.url}`}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
