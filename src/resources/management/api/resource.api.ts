import { apiRequest } from "@/resources/shared/api/api-client";
import type { GenericRecord, ResourcePageResult } from "@/resources/management/types/resource.types";

export function listResourceRequest(slug: string, page: number, limit: number) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiRequest<ResourcePageResult>(`${slug}?${query.toString()}`);
}

export function createResourceRequest(slug: string, body: Record<string, unknown>) {
  return apiRequest<GenericRecord>(slug, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export function updateResourceRequest(slug: string, id: string, body: Record<string, unknown>) {
  return apiRequest<GenericRecord>(`${slug}/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export function deleteResourceRequest(slug: string, id: string) {
  return apiRequest<void>(`${slug}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function importResourceRequest(slug: string, file: File, requiredField: string, value: string) {
  const data = new FormData();
  data.set("file", file);
  data.set(requiredField, value);
  return apiRequest<GenericRecord>(`${slug}/import-excel`, { method: "POST", body: data });
}
