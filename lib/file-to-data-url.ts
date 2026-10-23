const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.78;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

export function isAcceptedImageFile(file: File): boolean {
  return ACCEPTED_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (!isAcceptedImageFile(file)) {
    throw new Error('Only JPEG, PNG, WebP, or GIF images are allowed.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const { width, height } = fitWithin(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      MAX_EDGE,
    );
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image.');
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await fileToDataUrl(file));
  }
  return urls;
}

function fitWithin(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read image file.'));
    image.src = src;
  });
}
