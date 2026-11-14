import { apiRequest } from "@/resources/shared/api/api-client";
import type { OwnProfile, OwnProfileUpdate } from "@/resources/profile/types/profile.types";

export const getOwnProfileRequest = () => apiRequest<OwnProfile | null>("auth/me/profile");

export const updateOwnProfileRequest = (input: OwnProfileUpdate) => apiRequest<OwnProfile>("auth/me/profile", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
});
