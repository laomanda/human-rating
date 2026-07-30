import type { AchievementCollection } from "@/features/achievement/achievement-types";

export type PublicProfileCardData = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type PublicProfileAttribute = {
  key:
    | "energy"
    | "focus"
    | "discipline"
    | "responsibility";
  label: string;
  value: number;
};

export type PublicRatingHistoryPoint = {
  overallRating: number;
  createdAt: string;
};

export type PublicPerformanceSummary = {
  averageOverall: number | null;
  bestOverall: number | null;
  averageEnergy: number | null;
  averageFocus: number | null;
  averageDiscipline: number | null;
  averageResponsibility: number | null;
  ratedDays: number;
  sampledRatingCount: number;
  strongestAttribute: PublicProfileAttribute | null;
  ratingHistory: PublicRatingHistoryPoint[];
};

export type PublicProfile = PublicProfileCardData & {
  bio: string | null;
  achievements: AchievementCollection;
  performance: PublicPerformanceSummary;
};

export type PublicProfileSearchResult = {
  available: boolean;
  errorMessage: string | null;
  profiles: PublicProfileCardData[];
};

export type PublicProfileResult = {
  status: "found" | "not_found" | "error";
  errorMessage: string | null;
  profile: PublicProfile | null;
};
