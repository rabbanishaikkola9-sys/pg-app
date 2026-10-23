'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { filesToDataUrls, isAcceptedImageFile } from '@/lib/file-to-data-url';
import { MAX_PROPERTY_IMAGES } from '@/lib/images';
import { cn } from '@/lib/utils';
import { StoredImage } from './stored-image';

type ImageUploaderProps = {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
};

export function ImageUploader({ value, onChange, max = MAX_PROPERTY_IMAGES, disabled, className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const remaining = Math.max(0, max - value.length);

  const pickFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || disabled) return;
    const files = Array.from(fileList).filter(isAcceptedImageFile).slice(0, remaining);
    if (!files.length) {
      toast.error('Choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    setBusy(true);
    try {
      const next = await filesToDataUrls(files);
      onChange([...value, ...next].slice(0, max));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not read image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {value.length}/{max} photos stored as base64 data URLs
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={disabled || busy || remaining === 0}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {busy ? 'Processing…' : 'Upload photos'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(event) => pickFiles(event.target.files)}
        />
      </div>

      {value.length === 0 ? (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-300 border-dashed bg-zinc-50 px-4 py-10 text-sm text-zinc-500 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-400/40"
        >
          <ImagePlus className="size-6 text-blue-500" />
          Add property photos. They are saved in the database as base64 URLs.
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((src, index) => (
            <li
              key={`${index}-${src.slice(0, 24)}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <StoredImage src={src} alt={`Property photo ${index + 1}`} sizes="200px" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 size-8 opacity-0 transition group-hover:opacity-100"
                disabled={disabled || busy}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remove photo ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
