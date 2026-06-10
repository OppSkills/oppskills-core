import type { PendingAttachmentKind } from "./attachmentTypes";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  csv: "text/csv",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
  tgz: "application/gzip",
  bz2: "application/x-bzip2",
  apk: "application/vnd.android.package-archive",
  epub: "application/epub+zip",
  json: "application/json",
  xml: "application/xml",
  html: "text/html",
  htm: "text/html",
  md: "text/markdown",
};

export function resolveChatUploadMime(
  file: File,
  kind: PendingAttachmentKind,
): string {
  const raw = file.type?.trim().toLowerCase() ?? "";
  if (raw && raw !== "application/octet-stream") return raw;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];

  if (kind === "image") return "image/jpeg";
  if (kind === "video") return "video/mp4";
  if (kind === "audio") return "audio/mpeg";
  return "application/octet-stream";
}

export function fileForChatUpload(file: File, mime: string): File {
  if (file.type === mime) return file;
  return new File([file], file.name, {
    type: mime,
    lastModified: file.lastModified,
  });
}
