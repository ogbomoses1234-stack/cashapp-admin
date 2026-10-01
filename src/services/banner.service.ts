import { del, get, patch, post } from './api';

export interface Banner {
  id: string;
  imageUrl: string;
  headline: string;
  subtext: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface BannerInput {
  imageUrl: string;
  headline: string;
  subtext?: string;
  ctaText?: string;
  ctaUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function listBanners(): Promise<Banner[]> {
  const data = await get<Banner[] | { items: Banner[] } | null>('/api/admin/banners');
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export function createBanner(input: BannerInput) {
  return post<Banner>('/api/admin/banners', input);
}

export function updateBanner(id: string, input: Partial<BannerInput>) {
  return patch<Banner>(`/api/admin/banners/${id}`, input);
}

export function deleteBanner(id: string) {
  return del<{ deleted: true }>(`/api/admin/banners/${id}`);
}
