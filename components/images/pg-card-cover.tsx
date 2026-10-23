'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { StoredImage } from '@/components/images/stored-image';
import { getDefaultPgPlaceholder } from '@/lib/images';
import { cn } from '@/lib/utils';

type PgCardCoverProps = {
  src?: string | null;
  alt: string;
  seed?: string | number | null;
  aspectRatio?: '16/10' | '16/9' | '4/3' | 'square' | 'auto';
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
};

const aspectClassMap = {
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  square: 'aspect-square',
  auto: '',
};

export function PgCardCover({
  src,
  alt,
  seed,
  aspectRatio = '16/10',
  className,
  imgClassName,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
}: PgCardCoverProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const fallbackUrl = getDefaultPgPlaceholder(seed ?? alt);
  const activeSrc = !src || loadFailed ? fallbackUrl : src;
  const isUsingPlaceholder = !src || loadFailed;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900',
        aspectClassMap[aspectRatio],
        className,
      )}
    >
      {!fallbackFailed ? (
        <StoredImage
          src={activeSrc}
          alt={alt}
          sizes={sizes}
          priority={priority}
          onError={() => {
            if (!loadFailed && src) {
              setLoadFailed(true);
            } else {
              setFallbackFailed(true);
            }
          }}
          className={cn('transition-transform duration-500', imgClassName)}
        />
      ) : (
        <div
          className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700"
          aria-hidden
        >
          <Building2 className="size-12 text-white/80" />
        </div>
      )}
      {isUsingPlaceholder && !fallbackFailed ? (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
