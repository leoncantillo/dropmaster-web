import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface PricingConfig {
  id: string;
  profitMarginTarget: number; // decimal (0.46 = 46%)
  averageShippingCost: number;
  returnRate: number; // decimal (0.067 = 6.7%)
  currency: string;
  rlc: number;
  updatedAt: string;
  createdAt: string;
}

export interface UpdatePricingConfigDTO {
  profitMarginTarget?: number;
  averageShippingCost?: number;
  returnRate?: number;
  currency?: string;
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const res = await apiClient.get<ApiResponse<PricingConfig>>('/pricing/config');
  return res.data.data;
}

export async function updatePricingConfig(
  dto: UpdatePricingConfigDTO
): Promise<PricingConfig> {
  const res = await apiClient.put<ApiResponse<PricingConfig>>(
    '/pricing/config',
    dto
  );
  return res.data.data;
}
