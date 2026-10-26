import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  contactInfo?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  contactInfo?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export async function listSuppliers(
  includeInactive?: boolean
): Promise<Supplier[]> {
  const params = includeInactive ? { includeInactive: true } : undefined;
  const res = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers', {
    params,
  });
  return res.data.data;
}

export async function createSupplier(
  input: CreateSupplierInput
): Promise<Supplier> {
  const res = await apiClient.post<ApiResponse<Supplier>>('/suppliers', input);
  return res.data.data;
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput
): Promise<Supplier> {
  const res = await apiClient.put<ApiResponse<Supplier>>(
    `/suppliers/${id}`,
    input
  );
  return res.data.data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/suppliers/${id}`);
}
