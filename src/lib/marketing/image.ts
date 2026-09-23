// Browser-only: checks a picked photo and shrinks it before upload, so uploads are fast and
// the AI never receives more pixels than it can use.
import { IMAGE_TYPES, MAX_EDGE_PX, MAX_PICK_BYTES, MAX_UPLOAD_BYTES } from "./constants";

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
  /** Shorter edge of the original photo, used to warn about low-resolution images. */
  originalMinEdge: number;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    throw new Error("iPhone HEIC photos are not supported yet. Please export the photo as JPG and try again.");
  }
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Please choose a JPG, PNG or WebP photo.");
  }
  if (file.size > MAX_PICK_BYTES) {
    throw new Error("This photo is larger than 15 MB. Please choose a smaller one.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image could not be opened. It may be damaged. Please try another photo.");
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image. Please try another browser.");
  ctx.fillStyle = "#ffffff"; // transparent PNGs would otherwise turn black as JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const originalMinEdge = Math.min(bitmap.width, bitmap.height);
  bitmap.close();

  let blob = await toBlob(canvas, 0.86);
  if (blob && blob.size > MAX_UPLOAD_BYTES) blob = await toBlob(canvas, 0.7);
  if (!blob || blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("This image could not be prepared for upload. Please try another photo.");
  }
  return { blob, width, height, originalMinEdge };
}
