import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface Order {
  id: string;
  dropiOrderId: string;
  shippingFee: number;
  discountPercentage: number; // decimal (0.1 = 10%)
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDTO {
  dropiOrderId: string;
  shippingFee: number;
  discountPercentage?: number;
  notes?: string | null;
}

export interface UpdateOrderDTO {
  shippingFee?: number;
  discountPercentage?: number;
  notes?: string | null;
}

export async function listOrders(search?: string): Promise<Order[]> {
  const params =
    search && search.trim().length > 0 ? { search: search.trim() } : undefined;
  const res = await apiClient.get<ApiResponse<Order[]>>('/orders', { params });
  return res.data.data;
}

export async function getOrder(id: string): Promise<Order> {
  const res = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data.data;
}

export async function createOrder(dto: CreateOrderDTO): Promise<Order> {
  const res = await apiClient.post<ApiResponse<Order>>('/orders', dto);
  return res.data.data;
}

export async function updateOrder(
  id: string,
  dto: UpdateOrderDTO
): Promise<Order> {
  const res = await apiClient.put<ApiResponse<Order>>(`/orders/${id}`, dto);
  return res.data.data;
}

export async function deleteOrder(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/orders/${id}`);
}
