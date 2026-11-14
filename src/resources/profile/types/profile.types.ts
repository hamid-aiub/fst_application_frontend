export interface OwnProfile {
  id?: string;
  userId?: string;
  profileImage: string | null;
  department: string | null;
  faculty: string | null;
  phoneNumber: string | null;
}

export interface OwnProfileUpdate {
  name?: string;
  profileImage?: string;
  department?: string;
  faculty?: string;
  phoneNumber?: string;
}
