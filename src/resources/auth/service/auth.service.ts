import {
  changePasswordRequest,
  currentUserRequest,
  signInRequest,
  signOutEverywhereRequest,
  signOutRequest,
} from "@/resources/auth/api/auth.api";
import type { SignInPayload } from "@/resources/auth/types/auth.types";

export const signIn = (input: SignInPayload) => signInRequest(input);
export const getCurrentUser = () => currentUserRequest();
export const signOut = () => signOutRequest();
export const changePassword = (input: { currentPassword: string; newPassword: string }) => changePasswordRequest(input);
export const signOutEverywhere = (userId: string) => signOutEverywhereRequest(userId);

export function hasPermission(permissions: string[], module: string, action: string) {
  return permissions.includes(`${module}.${action}`);
}

export function isAdministrator(roles: string[]) {
  return roles.includes("admin");
}
