import type { PresignImageUploadResponse } from "@/lib/api/mediaApi";

/**
 * Uploads a file to S3 using a presigned POST policy.
 *
 * This does not require AWS credentials in the browser.
 */
export async function uploadImageToS3PresignedPost(input: {
  presign: PresignImageUploadResponse;
  file: File;
}): Promise<void> {
  const form = new FormData();

  // Presigned fields must be included as-is and BEFORE the file field.
  for (const [k, v] of Object.entries(input.presign.fields)) {
    form.append(k, v);
  }

  // The file field must be named "file" for S3 POST uploads.
  form.append("file", input.file);

  const res = await fetch(input.presign.uploadUrl, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `S3 upload failed (${res.status}). ${text.trim().length > 0 ? text : ""}`,
    );
  }
}
