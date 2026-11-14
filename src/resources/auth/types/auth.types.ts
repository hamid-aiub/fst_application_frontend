export interface AuthUser {
  id: string;
  employeeId?: string;
  name?: string;
  email?: string;
  isActive: boolean;
  profile: {
    profileImage: string | null;
    department: string | null;
    faculty: string | null;
    type: string | null;
    status: string | null;
    joiningDate: string | null;
    phoneNumber: string | null;
  } | null;
  roles: string[];
  permissions: string[];
  rolePermissions?: Record<string, string[]>;
  sessionId: string;
}

export interface SignInPayload {
  identifier: string;
  password: string;
}

export interface SignInResult {
  user: Pick<AuthUser, "id" | "email" | "name" | "roles" | "permissions" | "rolePermissions">;
}
