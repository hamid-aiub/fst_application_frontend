export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\/+/, "")}`, {
    ...init,
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload
      ? Array.isArray(payload.message)
        ? payload.message.filter((item): item is string => typeof item === "string").join(" ")
        : typeof payload.message === "string" ? payload.message : "The request could not be completed."
      : "The request could not be completed.";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
