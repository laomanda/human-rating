export type ProfileSummary = {
  id: string;
  username: string | null;
};

export type AppConfigRow = {
  singleton: boolean;
  daily_match_lock_time: string;
  rating_queue_time: string;
  new_user_activation_cutoff: string;
  calibration_days: number;
  account_deletion_grace_days: number;
  morning_reminder_time: string;
  afternoon_reminder_time: string;
  evening_reminder_time: string;
  final_reminder_time: string;
  updated_at: string;
};

export type DailyMatchRow = {
  id: string;
  user_id: string;
  match_date: string;
  timezone: string;
  opens_at: string;
  input_closes_at: string;
  rating_queues_at: string;
  status: string;
  input_item_count: number;
  locked_at: string | null;
  queued_at: string | null;
  processing_started_at: string | null;
  rated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyRatingRow = {
  id: string;
  daily_match_id: string;
  user_id: string;

  energy_has_data: boolean;
  focus_has_data: boolean;
  discipline_has_data: boolean;
  responsibility_has_data: boolean;

  energy_rating: number | null;
  focus_rating: number | null;
  discipline_rating: number | null;
  responsibility_rating: number | null;
  overall_rating: number | null;

  source: string;
  provider_used: string | null;
  model_used: string | null;
  validation_flags: unknown;
  created_at: string;
};

export type DashboardAggregate = {
  averageOverall: number | null;
  averageEnergy: number | null;
  averageFocus: number | null;
  averageDiscipline: number | null;
  averageResponsibility: number | null;
  ratingCount: number;
};

export type DashboardHistoryItem = {
  match: DailyMatchRow;
  rating: DailyRatingRow | null;
};

export type BestPerformance = {
  match: DailyMatchRow | null;
  rating: DailyRatingRow;
};

export type DashboardData = {
  profile: ProfileSummary | null;
  appConfig: AppConfigRow | null;

  timeZone: string;

  todayMatch: DailyMatchRow | null;
  todayRating: DailyRatingRow | null;

  latestRating: DailyRatingRow | null;
  latestRatingMatch: DailyMatchRow | null;

  bestPerformance: BestPerformance | null;
  aggregate: DashboardAggregate;

  history: DashboardHistoryItem[];
  warnings: string[];
};