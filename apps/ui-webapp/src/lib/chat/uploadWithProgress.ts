import type {
  PresignDocumentUploadResponse,
  PresignImageUploadResponse,
} from "@/lib/api/mediaApi";

function buildPresignedForm(
  fields: Readonly<Record<string, string>>,
  file: File,
): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  const policyContentType = fields["Content-Type"];
  const payload =
    policyContentType && policyContentType.length > 0
      ? new Blob([file], { type: policyContentType })
      : file;
  form.append("file", payload, file.name);
  return form;
}

async function uploadPresignedPost(input: {
  uploadUrl: string;
  fields: Readonly<Record<string, string>>;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  const form = buildPresignedForm(input.fields, input.file);

  if (!input.onProgress) {
    const res = await fetch(input.uploadUrl, { method: "POST", body: form });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `S3 upload failed (${res.status}). ${text.trim().length > 0 ? text : ""}`,
      );
    }
    return;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", input.uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      input.onProgress?.(
        Math.round((event.loaded / event.total) * 100),
      );
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress?.(100);
        resolve();
      } else {
        const detail = xhr.responseText?.trim();
        reject(
          new Error(
            `S3 upload failed (${xhr.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
          ),
        );
      }
    };

    xhr.onerror = () => reject(new Error("S3 upload failed"));
    xhr.send(form);
  });
}

export async function uploadImageToS3WithProgress(input: {
  presign: PresignImageUploadResponse;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  await uploadPresignedPost({
    uploadUrl: input.presign.uploadUrl,
    fields: input.presign.fields,
    file: input.file,
    onProgress: input.onProgress,
  });
}

export async function uploadDocumentToS3WithProgress(input: {
  presign: PresignDocumentUploadResponse;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  await uploadPresignedPost({
    uploadUrl: input.presign.uploadUrl,
    fields: input.presign.fields,
    file: input.file,
    onProgress: input.onProgress,
  });
}
