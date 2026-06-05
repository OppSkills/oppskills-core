/**
 * Document MIME types and extensions aligned with common WhatsApp attachment support.
 * @see https://faq.whatsapp.com/general/chats/how-to-send-media-files-and-documents
 */

/** Extensions users can send as documents in chat */
export const CHAT_DOCUMENT_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'txt',
  'csv',
  'rtf',
  'odt',
  'ods',
  'odp',
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'tgz',
  'bz2',
  'apk',
  'epub',
  'json',
  'xml',
  'html',
  'htm',
  'md',
  'key',
  'pages',
  'numbers',
  'psd',
  'ai',
  'dmg',
  'exe',
  'msi',
  'deb',
  'rpm',
] as const;

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
  rtf: 'application/rtf',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  tgz: 'application/gzip',
  bz2: 'application/x-bzip2',
  apk: 'application/vnd.android.package-archive',
  epub: 'application/epub+zip',
  json: 'application/json',
  xml: 'application/xml',
  html: 'text/html',
  htm: 'text/html',
  md: 'text/markdown',
  key: 'application/vnd.apple.keynote',
  pages: 'application/vnd.apple.pages',
  numbers: 'application/vnd.apple.numbers',
  psd: 'image/vnd.adobe.photoshop',
  ai: 'application/postscript',
  dmg: 'application/x-apple-diskimage',
  exe: 'application/vnd.microsoft.portable-executable',
  msi: 'application/x-msdownload',
  deb: 'application/vnd.debian.binary-package',
  rpm: 'application/x-rpm',
};

/** MIME types accepted for chat document uploads (includes video as documents in some clients) */
export const CHAT_DOCUMENT_MIME_TYPES: readonly string[] = [
  ...Object.values(EXTENSION_TO_MIME),
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/gzip',
  'application/x-gzip',
  'application/octet-stream',
  'application/x-msdownload',
  'application/vnd.ms-powerpoint.presentation.macroenabled.12',
  'application/vnd.ms-excel.sheet.macroenabled.12',
  'application/vnd.ms-word.document.macroenabled.12',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const CHAT_MIME_SET = new Set(
  CHAT_DOCUMENT_MIME_TYPES.map((m) => m.toLowerCase()),
);

export function extensionFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return ext.length > 0 && ext.length <= 8 ? ext : '';
}

/**
 * Resolves a canonical MIME for S3 presign. Maps extension when the browser
 * reports a generic type (e.g. application/octet-stream for .gz).
 */
export function resolveChatDocumentMime(
  mimeType: string,
  fileName: string,
): string {
  const raw = mimeType.trim().toLowerCase();
  const ext = extensionFromFileName(fileName);

  if (raw && raw !== 'application/octet-stream' && CHAT_MIME_SET.has(raw)) {
    return raw;
  }

  if (ext && EXTENSION_TO_MIME[ext]) {
    return EXTENSION_TO_MIME[ext];
  }

  if (raw && CHAT_MIME_SET.has(raw)) {
    return raw;
  }

  throw new Error(`unsupported:${raw || 'unknown'}:${ext || 'none'}`);
}

export function isChatDocumentAllowed(
  mimeType: string,
  fileName: string,
): boolean {
  try {
    resolveChatDocumentMime(mimeType, fileName);
    return true;
  } catch {
    return false;
  }
}

export function mimeForDocumentExtension(
  mimeType: string,
  fileName: string,
): string {
  return resolveChatDocumentMime(mimeType, fileName);
}
