import { createUserRequest, deleteUserRequest, getUserRequest, importUsersRequest, listUsersRequest, updateUserRequest } from "@/resources/users/api/users.api";
import type { UserListQuery, UserRecord } from "@/resources/users/types/users.types";

export const listUsers = (query: UserListQuery) => listUsersRequest(query);
export const getUser = (id: string) => getUserRequest(id);
export const createUser = (input: { employeeId: string; name: string; email: string; password: string; isActive: boolean }) => createUserRequest(input);
export const updateUser = (id: string, input: Partial<Pick<UserRecord, "employeeId" | "name" | "email" | "isActive">>) => updateUserRequest(id, input);
export const deleteUser = (id: string) => deleteUserRequest(id);
export const importUsers = (file: File) => importUsersRequest(file);
