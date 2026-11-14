import { apiRequest } from "@/resources/shared/api/api-client";
import type { PaginatedUsers, UserDetail, UserImportResult, UserListQuery, UserRecord } from "@/resources/users/types/users.types";

export function listUsersRequest(query: UserListQuery) {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status && query.status !== "all") params.set("status", query.status);
  return apiRequest<PaginatedUsers>(`users?${params.toString()}`);
}

export function getUserRequest(id: string) {
  return apiRequest<UserDetail>(`users/${encodeURIComponent(id)}`);
}

export function createUserRequest(input: { employeeId: string; name: string; email: string; password: string; isActive: boolean }) {
  return apiRequest<UserRecord>("users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateUserRequest(id: string, input: Partial<Pick<UserRecord, "employeeId" | "name" | "email" | "isActive">>) {
  return apiRequest<UserRecord>(`users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteUserRequest(id: string) {
  return apiRequest<void>(`users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function importUsersRequest(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return apiRequest<UserImportResult>("users/import-excel", { method: "POST", body: formData });
}
