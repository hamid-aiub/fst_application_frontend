export interface OwnProfile {
  id?: string;
  userId?: string;
  profileImage: string | null;
  department: string | null;
  faculty: string | null;
  type: string | null;
  status: string | null;
  joiningDate: string | null;
  phoneNumber: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OwnProfileUpdate {
  name?: string;
  profileImage?: string;
  department?: string;
  faculty?: string;
  type?: string | null;
  status?: string | null;
  joiningDate?: string | null;
  phoneNumber?: string;
}
