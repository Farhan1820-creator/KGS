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

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary env vars are missing. Check .env.local");
  }

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
