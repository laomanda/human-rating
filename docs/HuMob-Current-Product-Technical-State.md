# HuMob Current Product & Technical State Documentation

**Version:** Current Implementation Audit  
**Audit date:** 2026-07-30  
**Basis:** Repository source code, local Supabase migrations, and read-only inspection of the linked Supabase database. This document describes the implementation observed during the audit, not the original PRD or the repository README.

## Scope and evidence

HuMob has evolved beyond the repository README. The README still describes a foundation-stage product and an older feature model, so it is not a reliable current-state reference. The source tree, active routes, Edge Function source, and live database objects are the sources used here.

Where a local migration and the linked database disagree, this document reports the linked database as the current deployed contract and identifies the difference as technical debt. Where deployment or scheduler configuration cannot be established from source or schema, it is explicitly marked as not found or not verified.

# 1. Product Overview

HuMob is a signed-in personal performance tracking web application. A user records activities against one Daily Match, then reviews final ratings, historical performance, calendar history, achievements, profile information, and limited public profile discovery.

The implemented product positioning is a personal daily performance record and rating system, not a coaching, social-feed, or health-diagnosis product. The main user behavior is:

1. Sign in with Google.
2. Complete a HuMob profile with a unique username and timezone.
3. Record physical and productive activities during the editable window of the current Daily Match.
4. Wait for the automated rating lifecycle to produce a final score.
5. Review the overall score and primary performance dimensions: Energy, Focus, Discipline (Productivity integrated).
6. Track completed ratings in dashboard visualizations, calendar, profile statistics, and public-profile summaries when the account is public.

The core value proposition implemented today is: structured personal daily input is transformed into a stored, explainable numerical performance history. AI can assist dimension adjustments, but the final score is still constrained by deterministic logic and configuration weights.

# 2. Current Technology Stack

## Frontend

| Area | Current implementation |
| --- | --- |
| Framework | Next.js `16.2.10`, App Router |
| Runtime UI | React `19.2.4` and React DOM `19.2.4` |
| Language | TypeScript with `strict: true` |
| Styling | Tailwind CSS `4`, global CSS, `clsx`, and `tailwind-merge` |
| Icons | `lucide-react` |
| Animation | `framer-motion` |
| Charts | `recharts` |
| Image handling | Next Image with configured Supabase and Google image hosts |
| Localization | User-facing copy is primarily Indonesian, with some remaining English copy |

## Backend and data

| Area | Current implementation |
| --- | --- |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth using Google OAuth from the implemented login UI |
| SSR session handling | `@supabase/ssr` server and browser clients; Next proxy refreshes session cookies |
| Authorization | Row Level Security on user-owned tables, database RPCs for protected profile mutations, and authenticated-only public projections |
| Storage | Supabase Storage bucket `avatars` for user-managed avatar uploads |
| Server mutation layer | Next Server Actions for settings, activities, notification read state, and token management |

## AI and rating pipeline

| Area | Current implementation |
| --- | --- |
| Primary provider | Groq |
| Primary model constant | `openai/gpt-oss-120b` |
| Backup provider | Configurable through `BACKUP_AI_*` Edge Function environment variables |
| Rating functions | `queue-daily-ratings`, `process-daily-ratings`, and `generate-ai-rating` |
| Rating rule versions | `humob-logic-v2.2.0` and `humob-integrity-v1.2.0` |
| Security | Job-only finalization uses `HUMOB_RATING_JOB_SECRET` in `x-humob-job-secret`, normalized and compared with a timing-safe function |

## Infrastructure, PWA, and push

| Area | Current implementation |
| --- | --- |
| PWA manifest | Next manifest route with standalone display, dark theme, icons, and Android FCM sender ID |
| Service worker | `public/sw.js`, registered by the authenticated app shell |
| Push client | Firebase Web Messaging with VAPID token request |
| Push sender source | Supabase Edge Function `send-push-notification`, using FCM HTTP v1 service-account credentials |
| HTTP hardening | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`; service worker has explicit content and cache headers |

# 3. Application Architecture

```text
src/
  app/          Next App Router pages, layouts, route handlers, loading and error boundaries
  components/   Shared UI that spans features: application shell, auth controls, activity forms/lists,
                profile inputs, and Daily Match status
  features/     Domain modules: activities, achievement, dashboard, explore, notification, profile,
                PWA, and settings
  lib/          Integration and cross-cutting helpers: Supabase SSR/browser clients, Firebase, redirects,
                and class-name utility
supabase/
  functions/    Deno Edge Functions and shared rating/FCM modules
  migrations/   Local SQL migration history and database intent
public/         Icons and service worker
```

## Layer responsibilities

**`src/app`** owns routes and server-rendered page composition. Dashboard pages read the authenticated user with the SSR Supabase client before loading feature queries. Most dynamic user pages export `dynamic = "force-dynamic"`.

**`src/features`** owns domain types, normalizers, queries, server actions, and domain UI. For example, `features/dashboard/queries.ts` shapes dashboard data from `daily_matches`, `daily_ratings`, `profiles`, `app_config`, and the achievement collection.

**`src/components`** provides shared presentation and controls used by more than one domain. `AppShell` supplies desktop sidebar, mobile bottom navigation, header unread badge, PWA registration, and install prompt. Daily activity forms and lists are also in this shared layer.

**`src/lib`** isolates external client construction. `lib/supabase/server.ts` uses Next cookies, `lib/supabase/client.ts` provides a browser singleton, and `lib/supabase/proxy.ts` refreshes session cookies and protects `/dashboard` and `/onboarding`.

**`supabase/functions/_shared/rating`** contains the core backend rating implementation: canonical input loading, integrity checks, logic scoring, input hashing, provider execution, queue state transitions, final-rating persistence, and tests. Edge Function entry points stay comparatively thin.

# 4. Current Implemented Pages and Routes

All dashboard routes are nested under the authenticated dashboard layout. The layout requires a valid Supabase user, an active profile, and completed onboarding before rendering `AppShell`.

## `/`

**Purpose:** Public landing page.  
**Data source:** None.  
**Experience:** Static marketing-style introduction with links to `/dashboard`. It still calls itself "HuMob Web Foundation", which no longer reflects the current product scope.

## `/login`

**Purpose:** Google sign-in entry point.  
**Data source:** Supabase Auth client-side OAuth invocation.  
**Experience:** Google-only sign-in control, with a return-path flow to the original protected route.

## `/auth/callback`

**Purpose:** OAuth code exchange route handler.  
**Data source:** Supabase Auth and `profiles`.  
**Experience:** Exchanges code for a session, loads the profile, redirects incomplete users to onboarding, and redirects active completed users to the safe internal destination.

## `/auth/auth-code-error`

**Purpose:** Authentication callback failure state.  
**Data source:** None.  
**Experience:** Readable authentication failure route. No alternate sign-in method is implemented.

## `/onboarding`

**Purpose:** Required first-time profile completion.  
**Data source:** `profiles`; protected RPCs `check_username_availability` and `complete_my_onboarding`; Supabase Storage for optional avatar.  
**Experience:** User sets full name, unique username, bio, timezone, and optional avatar. Completed profiles are redirected onward; inactive or missing profiles are rejected.

## `/dashboard`

**Purpose:** Main authenticated performance overview.  
**Data source:** `profiles`, `app_config`, up to 400 `daily_matches`, up to 400 `daily_ratings`, achievement projection, and a separate best-rating lookup.  
**Components:** `RatingSummary`, `RatingMetadata`, `RatingTrend`, `PerformanceChart`, `DimensionProgress`, `PerformanceCalendar`, `PerformanceHistory`, `AchievementList`, and `DailyMatchLiveStatus`.  
**Experience:** Shows aggregate score, rated-day count, deterministic trend, today's rating or latest fallback, performance journey, best performance, current Daily Match lifecycle, calendar, and recent history. Development mode additionally shows timing/config diagnostics and query warnings.

## `/dashboard/today`

**Purpose:** Daily Match input and final-rating view.  
**Data source:** `ensure_today_daily_match` RPC, `daily_matches`, `physical_activities`, `productive_activities`, and `daily_ratings`.  
**Experience:** During an editable match, users create, edit, and delete physical and productive activity records. Once the match is rated, the page replaces input emphasis with final overall and dimension ratings plus safe metadata. It displays the lifecycle status throughout.

## `/dashboard/calendar`

**Purpose:** Standalone monthly rating calendar.  
**Data source:** The same user-owned `daily_matches` and `daily_ratings` contract as dashboard calendar data.  
**Components:** `PerformanceCalendar` and `CalendarDayDetail`.  
**Experience:** Previous month, next month, and today navigation. A rated date shows a score bubble; a date with no rating is represented as an input opportunity. Selecting a rated day reveals overall score, four dimensions, and safe rating source.

## `/dashboard/profile`

**Purpose:** Private owner profile and performance summary.  
**Data source:** `profiles`, last 60 `daily_ratings`, total rating count, best overall rating, and achievement collection.  
**Experience:** Shows profile identity, average overall, best rating, rated days, strongest attribute, current privacy state, account status, and the full achievement collection.

## `/dashboard/profile/edit`

**Purpose:** Dedicated profile editor.  
**Data source:** `profiles`, `update_my_profile` RPC, and avatar storage.  
**Experience:** Updates full name, bio, and avatar. Username is deliberately read-only after onboarding.

## `/dashboard/explore`

**Purpose:** Discovery of public HuMob profiles.  
**Data source:** `public_profiles` view.  
**Experience:** Server-rendered form submission using `?q=`; searches username and display name. The UI asks for at least two characters. It provides loading and readable error states but does not implement client-side debounce.

## `/profile/[username]`

**Purpose:** Public performance profile, available only to signed-in users in the current implementation.  
**Data source:** `public_profiles`, `public_profile_ratings`, and `public_user_achievements` views.  
**Experience:** Shows avatar, name, username, bio, public averages, best rating, rated-day count, strongest dimension, aggregate dimension chart, mini overall-rating history, and unlocked achievement progress. It does not render individual activity text, provider/model details, raw flags, or private inputs.

## `/dashboard/notifications`

**Purpose:** Notification inbox and browser push permission control.  
**Data source:** `notifications`, `notification_preferences`, and `device_tokens`; Firebase client messaging.  
**Experience:** Lists up to 50 notifications, supports marking one or all as read, and displays an enable/disable flow for browser push permission.

## `/dashboard/settings`

**Purpose:** Account, notification, privacy, and deletion-request settings.  
**Data source:** `profiles`, `notification_preferences`, `account_deletion_requests`, `update_my_profile`, `update_my_profile_privacy`, and `update_my_notification_preference`.  
**Experience:** Updates profile fields and avatar, toggles one unified push preference, toggles public/private profile state, signs out, and submits an account deletion request.

## Route state coverage

Loading UI exists for dashboard, calendar, today, profile, explore, notifications, settings, onboarding, and public profile. Error boundaries exist for dashboard, today, settings, notifications, explore, onboarding, and public profile. They keep failures from becoming blank pages, but message language and detail level are inconsistent across routes.

# 5. Feature Inventory

## Authentication

**Purpose:** Establish an authenticated HuMob identity and protect personal data.  
**Flow:** The login UI invokes Google OAuth through Supabase. `/auth/callback` exchanges the authorization code, fetches the authenticated user, and checks the linked profile. The Next proxy refreshes cookies and redirects unauthenticated access to `/dashboard` or `/onboarding` to `/login`. The dashboard layout repeats the profile, account-status, and onboarding checks server-side.

**Current status:** Implemented for Google OAuth.  
**Limitations:** No email/password or other provider UI is present. Account status in the observed database has `active` and `pending_deletion`; UI code also contains display labels for statuses not observed in the enum.

## Daily Performance Rating

**Purpose:** Collect daily evidence and persist a final numerical rating.  
**User flow:** The Today page calls `ensure_today_daily_match`, receives the current user/timezone-specific match, and allows activity changes only while its status is editable. The implemented browser forms collect:

- Physical activity: type, optional custom name, intensity, and reason/context.
- Productive activity: category, title, and description.

The database and rating canonical-input loader also support `sleep_entries`, `responsibilities`, and `other_activities`. No equivalent browser input forms for those three data types were found in the current application.

**Rating generation flow:**

```text
Daily Match reaches queue time
  -> queue-daily-ratings transitions eligible open/locked matches to queued
  -> process-daily-ratings loads queued work and invokes generate-ai-rating
  -> canonical input + integrity validation + deterministic logic scoring
  -> optional provider adjustment, capped by scoring configuration
  -> daily_ratings insert
  -> after_daily_rating_change database trigger updates match/statistics/baselines
  -> dashboard, today, profile, history, and calendar read the final row
```

`generate-ai-rating` permits user-authenticated previews but restricts finalization to the internal job secret. It hashes canonical input, avoids AI when input fails eligibility, uses logic fallback if AI is unavailable, and stores the source as `ai_primary`, `ai_fallback`, `logic_fallback`, or `no_activity`.

**Dimensions:** Energy, Focus, Discipline, and weighted Overall (Responsibility permanently deprecated). The overall is calculated server-side from dimension values and active weights; the provider never directly supplies final overall.

**Current status:** Backend code, Edge Function entry points, persistence schema, and automated tests are present.  
**Limitations:** No scheduler or external invocation configuration for the queue/worker was found in this repository, so automatic production scheduling cannot be verified from code alone. Browser input currently covers only two of the five input table categories.

## Dashboard and performance visualization

**Purpose:** Let the owner understand current and historical rating results.  
**Data behavior:** Dashboard loads a maximum of 400 matches and ratings, calculates aggregate averages from the most recent 60 ratings in Next.js, shows 30 items in history, and derives a best performance from database ordering with a fallback sort.

**Displayed information:** Overall average, total rated days, a four-or-more-point deterministic trend, today's rating or latest rating fallback, safe source/validation metadata, line chart, dimension aggregate visualization, best performance, daily lifecycle panel, calendar, history table, and latest achievements.

**Current status:** Implemented with real data.  
**Limitations:** Several dashboard queries are intentionally parallel but remain separate reads; the dashboard reads broader history than individual panels need. Development-only diagnostics render database warning strings, so those diagnostics should remain disabled in production as currently intended.

## Calendar

**Purpose:** Monthly visual navigation of Daily Match and rating history.  
**Data behavior:** Calendar days are generated from user-owned `daily_matches` and joined in memory to `daily_ratings` by match ID. No mock scores are produced.

**Current status:** Implemented.  
**Limitations:** The data fetch limit is 400 records, so very long account histories are not an unlimited archive in the current UI. A no-rating day is displayed as an input opportunity, but the calendar does not create a match directly.

## Achievement System

**Purpose:** Show seven defined milestones: First Match, Good Form, Unbeaten Week, Focused, Responsible, Elite Performance, and 30 Matches.  
**Frontend behavior:** The UI has a fixed local definition list and reads unlock rows from `public_user_achievements`; it calculates unlocked count, total count, latest unlocks, and a safe unavailable state.

**Current status:** Achievement presentation is implemented on dashboard, owner profile, and public profile.  
**Observed database limitation:** The linked database has the legacy `user_achievements` structure (`achievement_id`, `earned_at`, optional `daily_match_id`) and the projection joins it to `achievements`. The local Phase 7 migration expects a different `achievement_key` schema and trigger-based evaluator. The observed trigger list does not include the local achievement-evaluation trigger. Therefore automatic achievement evaluation is **not verified as active** in the linked database, even though the display layer and public projection exist.

## Explore and public profile

**Purpose:** Signed-in discovery and viewing of public profiles without social follow, feed, chat, or ranking features.  
**Flow:** Explore searches `public_profiles` by username/full name and links to `/profile/[username]`. Public profile loads profile identity, ratings, and achievement projection independently, then calculates averages and rating history in the Next.js layer.

**Privacy behavior in UI:** Private profiles are excluded from `public_profiles`; the UI first resolves a public profile before asking for that profile's ratings. Individual activity records and internal rating metadata are not rendered.

**Current status:** Implemented.  
**Critical data-layer limitation:** The observed `public_profile_ratings` view currently selects all rows from `daily_ratings` without joining `public_profiles` or filtering `is_private`. The view is selectable by `authenticated` and has no `security_invoker` option. The public profile UI preserves privacy through query order, but the view itself is not a sufficient database privacy boundary. `public_user_achievements` also exposes all unlocked achievements through a join without an `is_private` filter. Direct client access must be treated as a privacy risk until the views are corrected and verified.

## Notification system

**Purpose:** Provide an in-app inbox, read state, browser permission control, and intended FCM push delivery.  
**Implemented inbox behavior:** `notifications` is queried for the signed-in user, sorted newest-first, limited to 50, and can be marked read individually or in bulk. The app header queries an unread count on route changes.

**Implemented preference behavior:** Settings and the Notifications page share the secure `update_my_notification_preference` RPC for `push_enabled`. The real preference table additionally has per-reminder/per-event flags and times, but the UI currently exposes only one master push toggle.

**Push flow intended by source:**

```text
Notification event
  -> notifications row
  -> database trigger / HTTP dispatch
  -> send-push-notification Edge Function
  -> active device_tokens
  -> FCM HTTP v1
  -> service worker background notification
```

**Current status:** Inbox, unread state, FCM token-request UI, service worker receiver, device token data model, and sender Edge Function source are implemented.  
**Observed limitations:**

- The observed database trigger list does not contain notification-event or push-delivery triggers from local migrations. Automatic notification creation and dispatch are therefore not verified active.
- The observed `notifications` schema has `delivery_status` but no `push_status`; `send-push-notification` source reads and writes `push_status`. This is a concrete production contract mismatch.
- The frontend notification union recognizes older values (`daily_reminder`, `rating_completed`, `achievement_unlocked`, `system`), while the observed database enum contains values such as `daily_match_morning`, `rating_ready`, and `achievement`. Unknown values are normalized to `system`, so intended category labels can be lost.
- `saveDeviceToken` is a server action but derives a default device name from `navigator`; that browser-global dependency is environment-sensitive in a server execution context.

## PWA

**Purpose:** Allow standalone installation and receive background FCM notifications.  
**Implementation:** `/manifest.webmanifest` is generated by `src/app/manifest.ts`; `AppShell` registers `/sw.js` after page load and displays a custom install prompt for supporting browsers. The service worker imports Firebase compatibility libraries, handles background notifications and clicks, precaches only public shell assets, and does not cache dashboard/auth/API data.

**Current status:** Manifest, icons, registration, install UI, and secure cache strategy are implemented.  
**Limitations:** Offline support is intentionally limited to the shell; authenticated dashboard use is not offline-capable. Install dismissal only lasts for the current session. FCM delivery remains subject to the data-contract and dispatch gaps above.

## Settings and account management

**Purpose:** Manage personal account profile, notification preference, profile visibility, session, and deletion request.  
**Implemented settings:**

- Name, bio, and avatar update through `update_my_profile`.
- Avatar upload accepts JPEG, PNG, and WebP with a 2 MB UI limit and user-scoped storage path.
- Username is fixed after onboarding.
- Public/private state is changed through `update_my_profile_privacy` and displayed on owner profile.
- One unified push toggle is synchronized between Settings and Notifications through the notification-preference RPC and route revalidation.
- Logout uses Supabase Auth sign-out.
- Account deletion inserts a `pending` request in `account_deletion_requests`.

**Current status:** Implemented.  
**Limitations:** No cancellation flow, administrator workflow, or purge worker is present in the audited application source. The UI says deletion will be processed by a team within seven working days, but the repository does not implement that downstream process.

# 6. Database Architecture

All tables below were observed in the linked `public` schema. User-owned tables listed as protected have RLS enabled and observed policies constrain their normal client operations to `auth.uid()` ownership.

## Product-facing tables

### `profiles`

**Purpose:** HuMob profile and account state linked to Supabase Auth.  
**Used fields:** `id`, `username`, `full_name`, `avatar_url`, `bio`, `is_private`, `timezone`, `pending_timezone`, `timezone_effective_from`, `onboarding_completed`, `daily_match_start_date`, `account_status`, timestamps.  
**Relationship:** One profile per auth user; parent for matches, activities, ratings, notifications, device tokens, and deletion requests.  
**Security:** RLS is enabled. Owner SELECT/UPDATE policies exist. Sensitive profile changes are guarded by database triggers and protected RPCs.

### `daily_matches`

**Purpose:** The per-user, timezone-aware daily lifecycle record.  
**Used fields:** `id`, `user_id`, `match_date`, `timezone`, open/close/queue timestamps, status, input count, lifecycle timestamps, and timestamps.  
**Relationship:** Parent for activity inputs, one final rating, and rating jobs.  
**Security:** RLS enabled; users can read own matches. Server-side lifecycle transitions occur through the rating backend/service role.

### `daily_ratings`

**Purpose:** Final persisted rating output.  
**Used fields:** ownership and match IDs, four `*_has_data` flags, logic scores, AI adjustments, four final dimensions, `overall_rating`, `source`, `provider_used`, `model_used`, `input_hash`, `validation_flags`, `created_at`.  
**Relationship:** One final row per Daily Match in the intended pipeline; drives dashboard, profile, calendar, public summaries, statistics, and achievements.  
**Security:** RLS enabled; normal users can read their own rows. Internal details are read by owner dashboard queries but are deliberately not rendered in public/profile-safe metadata components.

### `physical_activities`

**Purpose:** Physical activity evidence for a Daily Match.  
**Used fields:** `daily_match_id`, `user_id`, `activity_type`, `custom_activity_name`, `intensity`, `reason`, signature/template fields, flags, timestamps.  
**Relationship:** Belongs to Daily Match and profile.  
**Security:** RLS enabled; observed owner CRUD policies. Database triggers guard writable lifecycle periods and refresh match input count.

### `productive_activities`

**Purpose:** Productive-work evidence for a Daily Match.  
**Used fields:** `daily_match_id`, `user_id`, `category`, `title`, `description`, signature/template fields, flags, timestamps.  
**Security:** RLS enabled; observed owner CRUD policies and daily-input guards.

### `sleep_entries`, `responsibilities`, and `other_activities`

**Purpose:** Additional canonical rating inputs for sleep, obligations, and other classified activities.  
**Used by backend:** Canonical input loading and logic scoring.  
**Current UI use:** No matching input forms were found.  
**Security:** RLS enabled with observed owner-read policies; lifecycle guard/refresh triggers are present.

### `achievements` and `user_achievements`

**Purpose:** Achievement definitions and individual unlock records.  
**Observed columns:** `achievements` has `code`, title/description/icon, criteria data, and active state. `user_achievements` currently has `user_id`, `achievement_id`, `earned_at`, and `daily_match_id`.  
**Relationship:** Unlock row joins achievement definition by ID; exposed through the public achievement view.  
**Security:** RLS enabled. Authenticated users can read achievement definitions and their own unlock rows. See the migration-divergence note in the Achievement feature section.

### `notifications`

**Purpose:** In-app notification records.  
**Used fields:** `id`, `user_id`, `type`, title/message, JSON `payload`, `delivery_status`, scheduling/sending/read timestamps, FCM message ID, error message, and creation timestamp.  
**Security:** RLS enabled; observed owner read, update, and delete policies. A trigger guards user updates.  
**Important contract note:** Current table does not contain `push_status`, despite Edge Function source expecting it.

### `notification_preferences`

**Purpose:** Per-user notification controls and reminder times.  
**Used UI field:** `push_enabled`.  
**Available database fields:** Master toggle; morning, afternoon, evening, final reminder, rating-ready, achievement flags; four reminder times; `updated_at`.  
**Security:** RLS enabled with owner SELECT/INSERT/UPDATE. A security-definer RPC performs the current master-toggle update atomically.

### `device_tokens`

**Purpose:** Registered FCM web device tokens.  
**Used fields:** user, token, platform, device metadata, active state, last-seen time, timestamps.  
**Security:** RLS enabled with owner CRUD policies. The token itself is unique and is deactivated rather than necessarily deleted.

### `account_deletion_requests`

**Purpose:** Track a user's request to delete an account.  
**Used fields:** user, status, requested/scheduled/cancelled/completed timestamps, timestamps.  
**Security:** RLS enabled with observed owner read policy. Current app inserts pending requests; workflow completion is not found in app source.

## Rating-operational tables

### `app_config`

Singleton configuration read by dashboard. Used fields include daily match lock and queue times, new-user cutoff, calibration days, account deletion grace days, and reminder times.

### `scoring_configs`

Versioned weighting and AI-bound configuration: dimension weights, universal/personal weights, maximum AI adjustment, active state, and effective timestamp. The canonical rating loader reads the active configuration.

### `performance_baselines`

Per-user calibration count and four dimension baseline values. Database triggers update it after rating changes; canonical input loads it. Current UI does not display baseline comparison or personal-growth insight.

### `user_performance_stats`

Precomputed totals, sums, averages, best rating, calibration count, life-form fields, and last rated date. Database triggers maintain it. Current dashboard recomputes its visible aggregates from recent rating rows instead of reading this table.

### `rating_jobs`, `rating_attempts`, and `rating_dispatch_attempts`

Operational audit and retry records for queued rating work, AI/provider attempts, and dispatch requests. They are backend pipeline support, not exposed in the user interface.

### `activity_templates` and `reserved_usernames`

Internal support for reusable activity patterns and unavailable usernames. Activity templates are part of the data model but are not presented as a visible template-picker UI.

## Public projections

### `public_profiles`

View selecting `id`, username, name, avatar, and bio from profiles whose `is_private = false`.

### `public_profile_ratings`

View currently selecting user ID, four dimensions, overall rating, and creation time from all `daily_ratings`. It is readable by `authenticated`. It does not currently filter by public profile status; this is a privacy boundary defect.

### `public_user_achievements`

View joining `user_achievements` and `achievements`, returning user ID, achievement code, and unlock time. It is readable by `authenticated` and does not currently filter by public profile status; this is also a privacy risk.

# 7. Data Flow Documentation

## Authentication flow

```text
Google sign-in button
  -> Supabase OAuth redirect
  -> /auth/callback exchanges code for session
  -> getMyProfile
  -> incomplete profile: /onboarding
  -> active completed profile: requested safe internal route or /dashboard

Every request
  -> Next proxy refreshes Supabase session cookies
  -> dashboard layout confirms user, profile, active account, and onboarding
```

## Daily rating flow

```text
Today page
  -> ensure_today_daily_match RPC
  -> physical/productive activity Server Actions
  -> database lifecycle guards and input-count trigger
  -> queue-daily-ratings Edge Function (job secret)
  -> process-daily-ratings Edge Function (job secret)
  -> generate-ai-rating Edge Function (job secret for finalization)
  -> canonical input, integrity checks, logic score, optional constrained AI adjustment
  -> daily_ratings insert
  -> after_daily_rating_change trigger
  -> daily_matches rated state, performance stats/baselines refresh
  -> Today/Dashboard/Calendar/Profile reads
```

## Achievement flow

```text
Intended local-migration flow:
daily_ratings insert
  -> achievement evaluation trigger
  -> user_achievements unlock row
  -> public_user_achievements projection
  -> dashboard/profile/public profile collection
```

The display and projection are present. The linked database did not show the local trigger-based evaluator, so the automatic middle portion is not verified deployed.

## Notification flow

```text
In-app flow:
notification row for current user
  -> Notifications page / header unread query
  -> Server Action updates read_at

Intended push flow:
notification event
  -> notifications row
  -> database push trigger / HTTP dispatch
  -> send-push-notification Edge Function
  -> active FCM tokens
  -> FCM
  -> public/sw.js background notification
```

The user-controlled master preference is read before token push. The observed database does not confirm the event and dispatch trigger portion, and sender code currently expects an absent `push_status` column.

## Settings flow

```text
User changes a setting
  -> client component optimistic state / pending state
  -> Next Server Action
  -> SSR Supabase client verifies current user
  -> direct scoped mutation or protected RPC
  -> route revalidation
  -> Settings and related page render fresh state
```

Privacy uses `update_my_profile_privacy`; push preference uses `update_my_notification_preference`; profile text/avatar uses `update_my_profile` plus Storage.

# 8. Current User Journey

## New user journey

1. The user opens the landing page and selects dashboard access.
2. Protected routing sends unauthenticated users to Google sign-in.
3. OAuth callback establishes the session and finds an incomplete profile.
4. Onboarding requires name, a unique username, timezone, and optional bio/avatar.
5. The user enters Dashboard and opens Today's Daily Match.
6. The user adds physical activity and/or productive activity while the Daily Match remains editable.
7. At the configured lifecycle time, backend automation is intended to queue and process the rating.
8. When rated, Today and Dashboard show final overall/dimension ratings and source metadata.
9. The user can inspect history, calendar, profile aggregate, and achievement collection.
10. The user can make their profile public, then become discoverable through Explore and `/profile/[username]`.

## Existing user daily routine

1. Sign in or reopen the PWA.
2. Dashboard shows Daily Match status and the most relevant available rating.
3. Open Today and add/edit/delete today's eligible physical and productive activities.
4. Return after processing to read final score and dimensions.
5. Review trend, chart, calendar, best performance, and history.
6. Read notifications and optionally enable browser push.
7. Review achievements and adjust profile/settings as needed.

There is no implemented user-to-user interaction beyond public-profile search and viewing.

# 9. Current Product Strengths

- **Strong domain separation:** Dashboard, profile, activities, settings, notification, explore, and achievement code are separate feature modules rather than one large page layer.
- **Secure authenticated architecture:** SSR session handling, proxy route protection, server-side dashboard guards, RLS on core private tables, and protected profile RPCs are all present.
- **Rating integrity design:** Canonical input, input hash, explicit evidence flags, deterministic logic, bounded AI adjustments, and fallback sources make the scoring pipeline substantially more auditable than direct free-form AI scoring.
- **Lifecycle-aware experience:** Daily Match open/locked/queued/processing/rated states are surfaced rather than treating ratings as instantaneous.
- **Real-data dashboard:** Rating summary, trend, chart, calendar, history, best performance, and profile stats are driven by actual rating rows rather than mocked values.
- **Responsive application shell:** Desktop sidebar, sticky header, mobile bottom navigation, safe-area handling, loading states, and many route-level error boundaries are implemented.
- **Privacy-oriented rendering:** Public profile UI intentionally omits raw activities, provider/model fields, and validation flags.
- **PWA cache restraint:** Authenticated and dynamic pages are deliberately excluded from service-worker cache, avoiding private dashboard data in cache storage.

# 10. Current Weaknesses and Technical Debt

## Database and deployment alignment

1. **Migration/schema divergence:** Local Phase 7/8 notification, achievement, public projection, and push migrations are not a clean representation of the observed legacy database contract. The linked database has legacy `user_achievements`, notification enums, and preference columns. This previously prevented a full `supabase db push` because local achievement migration expects `achievement_key` on an existing legacy table.
2. **Public projection privacy defect:** `public_profile_ratings` and `public_user_achievements` are readable by authenticated users but their observed SQL definitions do not filter `profiles.is_private`. The UI is careful, but database views must enforce privacy independently.
3. **Push schema mismatch:** Sender source uses `notifications.push_status`; the linked table only has `delivery_status`. The push sender cannot be considered production-compatible until that contract is reconciled.
4. **Unverified trigger deployment:** The observed trigger set has rating-stat refresh and lifecycle guards, but not the local notification and achievement triggers. Automatic unlock and notification generation should not be represented as verified live behavior.

## Product and UI implementation

1. **README and landing page are stale:** Both portray a much earlier product stage and use older terminology/dimensions.
2. **Today input coverage is incomplete:** Backend supports sleep, responsibilities, and other activities, but the browser only captures physical and productive entries.
3. **Notification language/contract mismatch:** UI notification types do not match observed database enum values, causing unknown types to become generic system notifications.
4. **Settings only expose a master push toggle:** More granular reminder/event settings exist in the database but have no current settings UI.
5. **Deletion request is incomplete as a product workflow:** The user can request deletion, but no cancellation, progress, staff process, or purge job is found.
6. **Explore search is server-submitted, not debounced:** Functional and simple, but it gives no live search experience.
7. **Error and copy consistency:** Some error boundaries are Indonesian, others are English; Today error state can render `error.message`, which should remain carefully sanitized. UI naming typos (`perfomance-chart.tsx` and `perfomance-history.tsx`) have been corrected.
8. **Potential server/client environment dependency:** `saveDeviceToken` runs as a Server Action yet reads `navigator` for a fallback device name. That should be moved or made server-safe during a future technical fix.
9. **Dashboard read cost:** The page reads up to 400 matches and ratings plus a best-rating query and achievement projection. This is acceptable for early scale but will require pagination, precomputed read models, or scoped date windows as user history grows.
10. **Baseline value is not a visible growth product:** `performance_baselines` exists and is refreshed by rating changes, but current dashboard UI neither compares today's score to personal baseline nor presents baseline-based insights.

# 11. UI/UX Improvement Roadmap Recommendation

This roadmap refines existing behavior only. It does not propose replacing the rating engine, adding a social feed, or changing schema as a design exercise.

## Phase 9.1: Global design system and state consistency

- Consolidate spacing, surface, border, typography, button, input, section-header, empty-state, loading-state, and error-state patterns already repeated across dashboard modules.
- Standardize Indonesian product copy and status labels across Dashboard, Today, Notifications, Settings, and error boundaries.
- Align card radii, dense data layout, score formatting, and mobile label behavior without rebuilding route architecture.
- Keep the existing accessibility foundation: semantic headings, skip link, focus rings, labels, ARIA switches, and mobile navigation.

## Phase 9.2: Dashboard information hierarchy

- Make today's current lifecycle and most relevant rating the clear first task, while retaining latest-rating fallback wording.
- Reduce visual duplication between rating overview, best performance, chart, history, and dimension panels.
- Improve empty and early-history states so a new user understands what is absent without inventing a score.
- Present the existing deterministic trend as contextual history rather than a categorical judgment.

## Phase 9.3: Today experience

- Improve activity-entry flow, edit/delete feedback, lifecycle lock messaging, and the transition from input to rated result.
- Make current supported categories clear while avoiding UI claims for sleep/responsibility input that does not exist.
- Surface safe validation outcome language without exposing provider or internal flag data.

## Phase 9.4: Profile, Explore, and privacy clarity

- Make public/private state and its effect on discovery obvious in Settings and Profile.
- Polish public profile hierarchy around identity, public aggregate, dimensions, history, and achievement progress.
- Improve Explore search empty/loading/error feedback while retaining server-side search architecture.
- Do not expand public data until the database-view privacy defect is corrected and verified.

## Phase 9.5: Notification and PWA UX

- Unify settings master toggle and notification permission state into a clear explanation of the difference between app preference and browser permission.
- Normalize notification category labels after database enum alignment.
- Improve inbox grouping/read feedback and push-support states.
- Keep PWA install prompt unobtrusive and retain the current no-private-cache policy.

## Preconditions before public-facing UI polish

Database contract reconciliation is higher priority than visual polish for public profiles, achievement unlocking, and push delivery. UI/UX work can safely proceed on dashboard layout, profile presentation, activities, and general component consistency, but public exposure and notification claims should be treated as conditional until the defects in Section 10 are addressed.

# 12. Current Completion Status

| Feature | Status | Notes |
| --- | --- | --- |
| Google authentication and SSR session | Implemented | Google OAuth UI, callback, proxy refresh, dashboard guard, onboarding redirect. |
| Profile onboarding and edit | Implemented | Unique username RPC, timezone, bio, avatar storage, protected profile updates. |
| Daily Match | Implemented | Timezone-aware match fetch/create RPC, lifecycle status, physical/productive CRUD UI. |
| Rating engine source | Implemented | Queue, worker, generator, integrity, logic, AI constraints, persistence, tests. Scheduler deployment is not verified from repository. |
| Rating presentation | Implemented | Today final result, dashboard overview, chart, dimensions, history, trend, best performance. |
| Calendar | Implemented | Real match/rating data, monthly navigation, detail panel, empty states. |
| Personal baseline data | Backend present, product surface pending | Table and refresh trigger exist; no baseline/growth insight UI found. |
| Achievement presentation | Implemented | Seven local definitions and collections on dashboard/profile/public profile. |
| Achievement automatic unlock | Not verified active | Local migration expects newer schema/trigger not found in linked database. |
| Explore and public profile UI | Implemented with security blocker | Public views exist and UI omits private inputs, but view-level privacy filtering is defective. |
| Notification inbox/read state | Implemented | Real table query, unread badge, mark read/all. Type mapping differs from database enum. |
| Browser push client/PWA | Partially implemented | Manifest, service worker, Firebase token flow, sender source. Delivery schema/trigger alignment is unresolved. |
| Settings | Implemented | Profile, master notification toggle, privacy toggle, logout, deletion request. |
| Account deletion completion | Pending | Request creation exists; cancellation/purge/admin workflow not found. |
| Error/loading states | Broadly implemented | Route coverage exists; copy and sanitization need standardization. |
| UI polish/refinement | Pending | Suitable next phase after resolving database contract blockers. |

## Final current-state conclusion

HuMob is a functioning Next.js/Supabase personal performance application with a substantial real-data dashboard, Daily Match flow, security-aware rating backend, profiles, calendar, and installed PWA foundation. It is not a blank foundation project.

The next product-design phase can refine existing flows, but it must not obscure the current data-layer blockers: public views do not independently enforce profile privacy, local migration intent diverges from the linked production schema, and notification/push and achievement automation are not fully verified against that schema. These are technical correctness and trust issues, not UI polish items.
