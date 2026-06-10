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

export class UploadAbortedError extends Error {
  constructor() {
    super("Upload aborted");
    this.name = "UploadAbortedError";
  }
}

async function uploadPresignedPost(input: {
  uploadUrl: string;
  fields: Readonly<Record<string, string>>;
  file: File;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const form = buildPresignedForm(input.fields, input.file);

  if (!input.onProgress && !input.signal) {
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

    const cleanup = () => {
      input.signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      xhr.abort();
      reject(new UploadAbortedError());
    };

    if (input.signal?.aborted) {
      onAbort();
      return;
    }
    input.signal?.addEventListener("abort", onAbort);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      input.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      cleanup();
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

    xhr.onerror = () => {
      cleanup();
      reject(new Error("S3 upload failed"));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new UploadAbortedError());
    };
    xhr.send(form);
  });
}

export async function uploadImageToS3WithProgress(input: {
  presign: PresignImageUploadResponse;
  file: File;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  await uploadPresignedPost({
    uploadUrl: input.presign.uploadUrl,
    fields: input.presign.fields,
    file: input.file,
    onProgress: input.onProgress,
    signal: input.signal,
  });
}

export async function uploadDocumentToS3WithProgress(input: {
  presign: PresignDocumentUploadResponse;
  file: File;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  await uploadPresignedPost({
    uploadUrl: input.presign.uploadUrl,
    fields: input.presign.fields,
    file: input.file,
    onProgress: input.onProgress,
    signal: input.signal,
  });
}
