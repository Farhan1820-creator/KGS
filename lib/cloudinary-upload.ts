// Unsigned upload — file goes browser -> Cloudinary directly, never touches our server.
// Requires an UNSIGNED upload preset (Cloudinary dashboard > Settings > Upload > Add upload preset > Signing mode: Unsigned).
//
// .env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name

export interface CloudinaryUploadResult {
  url: string;
  fileName: string;
  fileType: string;
}

function requireCloudinaryEnv() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary env vars are missing. Check .env.local");
  }
  return { cloudName, uploadPreset };
}

// Generic upload — any file type (images, PDFs, docs...), no client-side
// processing. Used for diary attachments etc. For photos, prefer
// `uploadImageToCloudinary` below: it resizes/compresses first and reports
// progress, which matters much more for user-picked camera photos.
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = requireCloudinaryEnv();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  // "auto" resource type accepts images, pdfs, docs, etc. in one endpoint
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("File upload failed");
  }

  const data = await res.json();

  return {
    url: data.secure_url as string,
    fileName: file.name,
    fileType: file.type,
  };
}

// ---- Image-optimized upload (profile photos etc.) --------------------------

export interface ImageUploadOptions {
  /** Reject the original file above this size, before any compression. Default 8MB. */
  maxSizeMB?: number;
  /** Longest edge after resizing, in pixels. Default 1000. */
  maxDimension?: number;
  /** JPEG quality, 0-1. Default 0.82. */
  quality?: number;
  /** Called with 0-100 as the (already-compressed) file uploads. */
  onProgress?: (percent: number) => void;
}

const DEFAULT_MAX_SIZE_MB = 8;
const DEFAULT_MAX_DIMENSION = 1000;
const DEFAULT_QUALITY = 0.82;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image. Try a different file."));
    };
    img.src = url;
  });
}

// Downscales to `maxDimension` on the longest side (never upscales) and
// re-encodes as JPEG at `quality` — shrinks typical phone-camera photos
// (often 3-8MB) down to a couple hundred KB before they ever leave the
// browser, which is what actually makes the upload feel fast.
async function compressImage(file: File, maxDimension: number, quality: number): Promise<Blob> {
  const img = await loadImageElement(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser can't process images here.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Could not process that image. Try a different file.");
    return blob;
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

function uploadBlob(blob: Blob, fileName: string, onProgress?: (percent: number) => void): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = requireCloudinaryEnv();

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("upload_preset", uploadPreset);

  // XHR (not fetch) so we get real upload progress events for the animation.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ url: data.secure_url as string, fileName, fileType: "image/jpeg" });
        } catch {
          reject(new Error("Unexpected response while uploading. Try again."));
        }
      } else {
        reject(new Error("Image upload failed. Try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Image upload failed. Check your connection."));
    xhr.send(formData);
  });
}

// Validates, compresses, and uploads a photo with progress reporting — use
// this (not the generic uploadToCloudinary) for any user-facing avatar/photo
// picker.
export async function uploadImageToCloudinary(file: File, options: ImageUploadOptions = {}): Promise<CloudinaryUploadResult> {
  const {
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    onProgress,
  } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Image is too large — please choose a file under ${maxSizeMB}MB.`);
  }

  onProgress?.(0);
  const compressed = await compressImage(file, maxDimension, quality);
  const fileName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
  return uploadBlob(compressed, fileName, onProgress);
}
