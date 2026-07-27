export type ProfileRecord = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
  timezone: string;
  onboarding_completed: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
};

export type UsernameAvailabilityResult = {
  success: boolean;
  available: boolean;
  code: string;
  message: string;
  normalized_username: string | null;
};

export type CompleteOnboardingInput = {
  fullName: string;
  username: string;
  bio: string;
  timezone: string;
  avatarUrl: string | null;
};

export type UpdateProfileInput = {
  fullName: string;
  bio: string;
  avatarUrl: string | null;
};

export type ProfileRpcProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  onboarding_completed: boolean;
};

export type ProfileRpcResult = {
  success: boolean;
  code: string;
  message: string;
  daily_match_start_date?: string | null;
  profile?: ProfileRpcProfile;
};

export type UploadedAvatar = {
  path: string;
  publicUrl: string;
};

export type ProfileAttributeKey =
  | "energy"
  | "focus"
  | "discipline"
  | "responsibility";

export type StrongestProfileAttribute = {
  key: ProfileAttributeKey;
  label: string;
  value: number;
};

export type ProfilePerformanceStats = {
  averageOverall: number | null;
  bestOverall: number | null;
  ratedDays: number;
  strongestAttribute: StrongestProfileAttribute | null;
};

export type ProfilePageData = {
  profile: ProfileRecord;
  stats: ProfilePerformanceStats;
};