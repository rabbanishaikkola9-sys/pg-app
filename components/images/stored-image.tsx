'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type StoredImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
  onError?: () => void;
  unoptimized?: boolean;
};

function isRemoteSrc(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/');
}

export function StoredImage({
  src,
  alt,
  className,
  sizes,
  fill = true,
  priority,
  onError,
  unoptimized,
}: StoredImageProps) {
  const isSvg = src.endsWith('.svg') || src.includes('.svg?');
  const isLocalPlaceholder = src.startsWith('/images/placeholders/');
  const shouldSkipOptimization = unoptimized ?? (isSvg || isLocalPlaceholder);

  if (isRemoteSrc(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={shouldSkipOptimization}
        onError={onError}
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    // data: URLs cannot go through next/image — render the stored base64 payload directly.
    // biome-ignore lint/performance/noImgElement: next/image rejects data: URLs used for stored uploads
    <img
      src={src}
      alt={alt}
      onError={onError}
      className={cn(fill ? 'absolute inset-0 h-full w-full object-cover' : 'object-cover', className)}
    />
  );
}
