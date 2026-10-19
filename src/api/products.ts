import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface ProductPricing {
  supplierPrice: number;
  profitMarginTarget: number;
  calculatedProfit: number;
  suggestedSalePrice: number;
}

export interface ProductSupplier {
  id: string;
  name: string;
  contactInfo: string | null;
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  supplierPrice: number;
  dropiId: string | null;
  details: string | null;
  stockQuantity: number;
  inStock: boolean;
  isActive: boolean;
  pricing: ProductPricing;
  supplier?: ProductSupplier;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDTO {
  supplierId: string;
  name: string;
  supplierPrice: number;
  dropiId?: string | null;
  details?: string | null;
}

export interface ProductFilterParams {
  search?: string;
  supplierId?: string;
  stockStatus?: 'all' | 'in_stock' | 'out_of_stock';
}

export async function listProducts(
  params?: ProductFilterParams
): Promise<Product[]> {
  const res = await apiClient.get<ApiResponse<Product[]>>('/products', {
    params,
  });
  return res.data.data;
}

export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  const res = await apiClient.post<ApiResponse<Product>>('/products', dto);
  return res.data.data;
}

export async function toggleStock(productId: string): Promise<Product> {
  const res = await apiClient.patch<ApiResponse<Product>>(
    `/products/${productId}/toggle-stock`
  );
  return res.data.data;
}
