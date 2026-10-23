'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StoredImage } from '@/components/images/stored-image';
import { getDefaultPgPlaceholder } from '@/lib/images';

type Props = {
  images: string[];
  name: string;
  fallbackGradient?: string;
};

export function PgImageGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const has = images.length > 0;
  const defaultPlaceholder = getDefaultPgPlaceholder(name);

  const go = (delta: number) => {
    setActive((cur) => (cur + delta + images.length) % images.length);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        {has ? (
          <StoredImage
            src={images[active]}
            alt={`${name} ${active + 1}`}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="transition-transform duration-500"
            priority
          />
        ) : (
          <StoredImage
            src={defaultPlaceholder}
            alt={`${name} preview`}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="transition-transform duration-500"
            priority
          />
        )}

        {has && images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2 text-zinc-900 shadow-md transition-transform duration-200 hover:scale-110 dark:bg-zinc-950/80 dark:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2 text-zinc-900 shadow-md transition-transform duration-200 hover:scale-110 dark:bg-zinc-950/80 dark:text-zinc-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((src, idx) => (
                <button
                  key={`${idx}-${src.slice(0, 24)}`}
                  type="button"
                  aria-label={`Go to photo ${idx + 1}`}
                  onClick={() => setActive(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === active ? 'w-6 bg-white' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {has && images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button
              key={`${idx}-${src.slice(0, 24)}`}
              type="button"
              onClick={() => setActive(idx)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${
                idx === active
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-zinc-200 opacity-75 hover:opacity-100 dark:border-zinc-700'
              }`}
            >
              <StoredImage src={src} alt={`${name} thumbnail ${idx + 1}`} sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
