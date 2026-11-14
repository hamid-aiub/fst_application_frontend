import { createResourceRequest, deleteResourceRequest, importResourceRequest, listResourceRequest, updateResourceRequest } from "@/resources/management/api/resource.api";

export const listResource = (slug: string, page: number, limit: number) => listResourceRequest(slug, page, limit);
export const createResource = (slug: string, body: Record<string, unknown>) => createResourceRequest(slug, body);
export const updateResource = (slug: string, id: string, body: Record<string, unknown>) => updateResourceRequest(slug, id, body);
export const deleteResource = (slug: string, id: string) => deleteResourceRequest(slug, id);
export const importResource = (slug: string, file: File, requiredField: string, value: string) => importResourceRequest(slug, file, requiredField, value);
