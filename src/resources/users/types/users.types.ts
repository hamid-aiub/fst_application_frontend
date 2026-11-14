export interface UserProfileSummary {
  profileImage: string | null;
  phoneNumber: string | null;
  department?: string | null;
  faculty?: string | null;
}

export interface UserRecord {
  id: string;
  employeeId?: string | null;
  name?: string | null;
  email?: string | null;
  isActive?: boolean | null;
  profile?: UserProfileSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  data: UserRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "inactive" | "all";
}

export interface UserImportResult {
  totalRows: number;
  createdCount: number;
  skippedCount: number;
  skippedRows: Array<{ row: number; reason: string }>;
}
