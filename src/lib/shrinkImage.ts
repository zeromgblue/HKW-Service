// Client-side downscale + recompress so phone photos (often 3-8MB) upload quickly and stay
// well under the server limits. Falls back to the original file if anything goes wrong.

// 1280px at this quality keeps a repair photo clear on a phone screen while sending far fewer
// bytes than 1600px/0.82, and upload time is mostly bytes on a mobile connection.
const MAX_DIMENSION = 1280;
const QUALITY = 0.75;
const SKIP_IF_SMALLER_THAN = 300 * 1024;

// What the server accepts as-is: both the type and the file extension have to match.
const UPLOADABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const UPLOADABLE_NAME = /\.(jpe?g|png|webp)$/i;

export function isUploadableImage(file: File): boolean {
  return UPLOADABLE_TYPES.has(file.type) && UPLOADABLE_NAME.test(file.name);
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

function decodeWithImageElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be decoded"));
    };
    img.src = url;
  });
}

// Older Android browsers reject the "from-image" option, and very large camera photos can run
// out of memory in createImageBitmap. A plain <img> handles both (and still honours rotation).
async function decodeImage(file: File): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    return decodeWithImageElement(file);
  }
}

export async function shrinkImage(file: File): Promise<File> {
  // Android pickers sometimes hand over photos with no type or no file extension. Those are
  // always re-encoded, so what gets uploaded is a properly named JPEG.
  const uploadable = isUploadableImage(file);
  try {
    const decoded = await decodeImage(file);
    if (!decoded.width || !decoded.height) {
      decoded.release();
      return file;
    }
    const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height));

    if (uploadable && scale === 1 && file.size <= SKIP_IF_SMALLER_THAN) {
      decoded.release();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(decoded.width * scale);
    canvas.height = Math.round(decoded.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      decoded.release();
      return file;
    }
    ctx.fillStyle = "#ffffff"; // JPEG has no alpha; flatten transparent PNG/WebP onto white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
    decoded.release();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob || blob.type !== "image/jpeg") return file;
    if (uploadable && scale === 1 && blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
