"use server";

// Server-only Cloudinary helpers. Deletion requires a *signed* request (API
// key + secret), unlike the unsigned browser upload in cloudinary-upload.ts —
// so this must run on the server, never in client code.
//
// .env.local (in addition to the NEXT_PUBLIC_* upload vars):
//   CLOUDINARY_API_KEY=your_api_key
//   CLOUDINARY_API_SECRET=your_api_secret

import { createHash } from "crypto";

// Pulls the public_id out of a Cloudinary secure_url, e.g.
// https://res.cloudinary.com/demo/image/upload/v1699999999/students/abc123.jpg
// -> "students/abc123". Returns null if the URL doesn't look like Cloudinary.
function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:$|\?)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

// Deletes an image from Cloudinary given its secure_url. Safe to call with
// null/empty/non-Cloudinary URLs — it just no-ops rather than throwing, so
// callers can fire-and-check without extra guards.
export async function deleteCloudinaryImage(url: string | null | undefined): Promise<{ success: boolean }> {
  if (!url) return { success: true };

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary deletion skipped: missing CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET env vars. Proceeding to clear from DB only.");
    return { success: true };
  }

  const publicId = publicIdFromUrl(url);
  if (!publicId) return { success: true }; // not a recognizable Cloudinary asset — nothing to do

  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return { success: data.result === "ok" || data.result === "not found" };
  } catch {
    return { success: false };
  }
}
