import { apiRequest } from "@/resources/shared/api/api-client";
import type { AuthUser, SignInPayload, SignInResult } from "@/resources/auth/types/auth.types";

async function readResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const responseMessage = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    const message = Array.isArray(responseMessage)
      ? responseMessage.filter((item: unknown): item is string => typeof item === "string").join(" ")
      : typeof responseMessage === "string" ? responseMessage : "The request could not be completed."
    throw new Error(message);
  }
  return payload as T;
}

export async function signInRequest(input: SignInPayload) {
  const response = await fetch("/session/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readResponse<SignInResult>(response);
}

export async function currentUserRequest() {
  const response = await fetch("/session/auth/me", { cache: "no-store" });
  return readResponse<AuthUser>(response);
}

export async function signOutRequest() {
  const response = await fetch("/session/auth/sign-out", {
    method: "POST",
    signal: AbortSignal.timeout(4_000),
  });
  return readResponse<{ message: string }>(response);
}

export function changePasswordRequest(input: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ message: string }>("auth/change-password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function signOutEverywhereRequest(userId: string) {
  return apiRequest<{ message: string; revokedSessions: number }>(
    `auth/users/${encodeURIComponent(userId)}/sign-out-everywhere`,
    { method: "POST" },
  );
}
