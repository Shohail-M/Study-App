// Canvas-based image compressor. Downscales to a max edge and re-encodes
// as JPEG. Most phone photos shrink 5-15x with no perceptible quality loss
// at chat sizes, dramatically cutting upload time.

export interface CompressOptions {
  maxEdge?: number;     // longest side in pixels
  quality?: number;     // 0..1 JPEG quality
  mimeType?: string;    // output mime
}

export interface CompressedImage {
  blob: Blob;
  file: File;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxEdge: 1600,
  quality: 0.82,
  mimeType: 'image/jpeg',
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to decode image.')); };
    img.src = url;
  });
}

function targetSize(w: number, h: number, maxEdge: number): { w: number; h: number } {
  const longest = Math.max(w, h);
  if (longest <= maxEdge) return { w, h };
  const ratio = maxEdge / longest;
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<CompressedImage> {
  const o = { ...DEFAULTS, ...opts };
  // GIFs / SVGs lose meaning when re-encoded as JPEG. Pass through unchanged.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return {
      blob: file,
      file,
      width: 0,
      height: 0,
      originalBytes: file.size,
      compressedBytes: file.size,
    };
  }

  const img = await loadImage(file);
  const { w, h } = targetSize(img.naturalWidth, img.naturalHeight, o.maxEdge);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported.');
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Canvas encode failed.'))),
      o.mimeType,
      o.quality,
    );
  });

  // Build a File so the upload preserves a sensible filename + type.
  const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
  const ext = o.mimeType === 'image/jpeg' ? 'jpg' : o.mimeType.split('/')[1] || 'bin';
  const compressedFile = new File([blob], `${baseName}.${ext}`, { type: o.mimeType });

  return {
    blob,
    file: compressedFile,
    width: w,
    height: h,
    originalBytes: file.size,
    compressedBytes: blob.size,
  };
}

// Iteratively compresses an image until it fits under `maxBytes`. Used when
// the destination has a hard size cap (e.g. embedding inline in a Firestore
// document, which has a 1MB per-doc limit). Walks down quality first, then
// dimensions, returning the smallest result it can produce.
export async function compressImageToTargetSize(
  file: File,
  maxBytes: number,
): Promise<CompressedImage> {
  const attempts: CompressOptions[] = [
    { maxEdge: 1280, quality: 0.78 },
    { maxEdge: 1024, quality: 0.72 },
    { maxEdge: 900,  quality: 0.65 },
    { maxEdge: 720,  quality: 0.6 },
    { maxEdge: 600,  quality: 0.55 },
    { maxEdge: 480,  quality: 0.5 },
  ];
  let last: CompressedImage | null = null;
  for (const opts of attempts) {
    const c = await compressImage(file, opts);
    last = c;
    if (c.compressedBytes <= maxBytes) return c;
  }
  if (!last) throw new Error('Compression failed.');
  return last; // best effort, caller decides what to do if still too big
}

// Reads a Blob as a base64 data URL. Used to embed images inline in
// Firestore documents (`data:image/jpeg;base64,...`).
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image as data URL.'));
    reader.readAsDataURL(blob);
  });
}
