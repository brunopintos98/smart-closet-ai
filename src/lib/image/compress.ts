/**
 * Resizes and re-encodes photos on the device before saving them, so a 12 MB
 * camera picture becomes a ~150-400 KB JPEG. Nothing is uploaded anywhere.
 */
export const MAX_DIMENSION = 1024;
export const TARGET_BYTES = 400 * 1024;
const QUALITY_STEPS = [0.82, 0.7, 0.55, 0.4];

export class ImageProcessingError extends Error {
  constructor(public code: "notImage" | "unreadable") {
    super(code);
  }
}

export function fitWithin(width: number, height: number, max = MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Some formats (e.g. HEIC on some browsers) fail here; try <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new ImageProcessingError("unreadable");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new ImageProcessingError("notImage");
  const source = await decode(file);
  const { width, height } = fitWithin(source.width, source.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageProcessingError("unreadable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close();

  let blob: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= TARGET_BYTES) break;
  }
  if (!blob) throw new ImageProcessingError("unreadable");
  return blob;
}
