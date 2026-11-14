import { getOwnProfileRequest, updateOwnProfileRequest } from "@/resources/profile/api/profile.api";
import type { OwnProfileUpdate } from "@/resources/profile/types/profile.types";

export const getOwnProfile = () => getOwnProfileRequest();
export const updateOwnProfile = (input: OwnProfileUpdate) => updateOwnProfileRequest(input);
