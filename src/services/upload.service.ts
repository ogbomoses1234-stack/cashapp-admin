import axios from 'axios';
import { post } from './api';

export type AdminUploadPurpose = 'product' | 'avatar';

interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  bucket: string;
  expiresIn: number;
}

export interface UploadImageResult {
  objectKey: string;
  publicUrl: string;
}

/**
 * Build the plain public URL for an object in qrcb-public.
 * No signing — public bucket means public access.
 */
export function buildPublicUrl(objectKey: string): string {
  const base = import.meta.env.VITE_MINIO_PUBLIC_URL;
  if (!base) return '';
  const clean = objectKey.replace(/^\/+/, '');
  return `${base.replace(/\/+$/, '')}/${clean}`;
}

export async function uploadImage(params: {
  file: File;
  purpose?: AdminUploadPurpose;
  onProgress?: (pct: number) => void;
}): Promise<UploadImageResult> {
const { file, purpose = 'avatar', onProgress } = params;

  const MAX = 5 * 1024 * 1024;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
  if (file.size > MAX) throw new Error('File too large (max 5MB)');
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Only JPG, PNG or WebP allowed');
  }

  let presign: PresignResponse;
  try {
    presign = await post<PresignResponse>('/api/admin/uploads/presign', {
      purpose,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (e) {
    const err = e as { status?: number };
    if (purpose === 'product' && err.status === 400) {
      presign = await post<PresignResponse>('/api/admin/uploads/presign', {
        purpose: 'avatar',
        mimeType: file.type,
        sizeBytes: file.size,
      });
    } else {
      throw e;
    }
  }

  await axios.put(presign.uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (ev) => {
      if (onProgress && ev.total) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    },
  });

  await post<{ objectKey: string; committed: true }>(
    '/api/admin/uploads/commit',
    { objectKey: presign.objectKey }
  );

  return {
    objectKey: presign.objectKey,
    publicUrl: buildPublicUrl(presign.objectKey),
  };
}
