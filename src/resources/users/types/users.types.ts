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

export interface UserDetail extends UserRecord {
  profile?: (UserProfileSummary & { joiningDate?: string | null; type?: string | null; status?: string | null }) | null;
  userRoleMappings?: Array<{ id: string; role?: { id: string; name: string } | null }>;
  sections?: Array<{
    id: string;
    name?: string | null;
    room1?: string | null;
    day1?: string | null;
    time1?: string | null;
    room2?: string | null;
    day2?: string | null;
    time2?: string | null;
    room3?: string | null;
    day3?: string | null;
    semesterId?: string | null;
    course?: { id: string; name?: string | null; courseCode?: string | null } | null;
    semester?: { id: string; name?: string | null } | null;
  }>;
  classCancellations?: Array<{
    id: string;
    classType?: string | null;
    reason?: string | null;
    cancellationDate?: string | null;
    makeupClassDatetime?: string | null;
    makeupClassRoom?: string | null;
    isApproved?: boolean | null;
    isAlreadyTaken?: boolean | null;
    semesterId?: string | null;
    semester?: { id: string; name?: string | null } | null;
    course?: { id: string; name?: string | null; courseCode?: string | null } | null;
    section?: { id: string; name?: string | null } | null;
  }>;
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
