import { apiClient } from './apiClient';
import { Platform } from 'react-native';

interface PresignResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  key: string;
  publicUrl: string;
}

export async function uploadDocument(
  fileUri: string,
  fileName: string,
  mimeType: string,
  purpose: 'opportunity_attachment' | 'user_profile' | 'event_attachment' = 'opportunity_attachment',
): Promise<{ key: string; publicUrl: string }> {
  // 1. Get presigned URL
  const { uploadUrl, fields, key, publicUrl } = await apiClient.post<PresignResponse>(
    '/media/presign-document',
    {
      purpose,
      fileName,
      mimeType,
    },
  );

  // 2. Upload file directly to S3
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    formData.append(k, v);
  });

  formData.append('file', {
    uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload document to S3');
  }

  return { key, publicUrl };
}
