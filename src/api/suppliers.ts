import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const res = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers');
  return res.data.data;
}
