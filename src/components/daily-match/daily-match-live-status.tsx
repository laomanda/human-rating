"use client";

import type { LucideIcon } from "lucide-react";

import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

type DailyMatchLifecycleStatus =
  | "open"
  | "locked"
  | "queued"
  | "processing"
  | "rated"
  | "failed";

type DailyMatchLiveStatusProps = {
  matchId: string | null;
  matchDate: string | null;
  timeZone: string;

  status: string | null;

  inputClosesAt: string | null;
  ratingQueuesAt: string | null;

  serverNow: string;

  variant?: "compact" | "panel";
  className?: string;
};

type LifecycleTone =
  | "emerald"
  | "amber"
  | "blue"
  | "violet"
  | "zinc"
  | "red";

type LifecycleView = {
  title: string;
  description: string;
  metricLabel: string | null;
  metricValue: string | null;
  icon: LucideIcon;
  animated: boolean;
  tone: LifecycleTone;
};

const KNOWN_STATUSES: DailyMatchLifecycleStatus[] = [
  "open",
  "locked",
  "queued",
  "processing",
  "rated",
  "failed",
];

const toneClasses: Record<
  LifecycleTone,
  {
    container: string;
    icon: string;
    title: string;
    metric: string;
  }
> = {
  emerald: {
    container:
      "border-emerald-400/20 bg-emerald-400/5",
    icon: "bg-emerald-400/10 text-emerald-300",
    title: "text-emerald-200",
    metric: "text-emerald-300",
  },

  amber: {
    container:
      "border-amber-400/20 bg-amber-400/5",
    icon: "bg-amber-400/10 text-amber-300",
    title: "text-amber-200",
    metric: "text-amber-300",
  },

  blue: {
    container:
      "border-blue-400/20 bg-blue-400/5",
    icon: "bg-blue-400/10 text-blue-300",
    title: "text-blue-200",
    metric: "text-blue-300",
  },

  violet: {
    container:
      "border-violet-400/20 bg-violet-400/5",
    icon: "bg-violet-400/10 text-violet-300",
    title: "text-violet-200",
    metric: "text-violet-300",
  },

  zinc: {
    container: "border-white/10 bg-white/[0.02]",
    icon: "bg-white/5 text-zinc-400",
    title: "text-zinc-200",
    metric: "text-zinc-300",
  },

  red: {
    container: "border-red-400/20 bg-red-400/5",
    icon: "bg-red-400/10 text-red-300",
    title: "text-red-200",
    metric: "text-red-300",
  },
};

function isKnownStatus(
  value: string | null,
): value is DailyMatchLifecycleStatus {
  return (
    value !== null &&
    KNOWN_STATUSES.includes(
      value as DailyMatchLifecycleStatus,
    )
  );
}

function parseTimestamp(
  value: string | null,
): number | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
}

function formatRemainingTime(
  milliseconds: number,
): string {
  const safeMilliseconds = Math.max(
    0,
    milliseconds,
  );

  const totalSeconds = Math.floor(
    safeMilliseconds / 1000,
  );

  const hours = Math.floor(
    totalSeconds / 3600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );

  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function getDateKeyForTimeZone(
  timestamp: number,
  timeZone: string,
): string | null {
  try {
    const parts = new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(new Date(timestamp));

    const year = parts.find(
      (part) => part.type === "year",
    )?.value;

    const month = parts.find(
      (part) => part.type === "month",
    )?.value;

    const day = parts.find(
      (part) => part.type === "day",
    )?.value;

    if (!year || !month || !day) {
      return null;
    }

    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

function getPollingInterval(
  matchId: string | null,
  status: DailyMatchLifecycleStatus | null,
): number | null {
  if (!matchId) {
    return 30_000;
  }

  switch (status) {
    case "open":
      return 60_000;

    case "locked":
      return 15_000;

    case "queued":
    case "processing":
      return 5_000;

    case "failed":
      return 30_000;

    case "rated":
      /*
       * Tidak melakukan request rating lagi.
       * Interval hanya mengecek pergantian tanggal lokal.
       */
      return 60_000;

    default:
      return 30_000;
  }
}

function getLifecycleView({
  matchId,
  status,
  estimatedNow,
  inputClosesAt,
  ratingQueuesAt,
}: {
  matchId: string | null;
  status: DailyMatchLifecycleStatus | null;
  estimatedNow: number;
  inputClosesAt: number | null;
  ratingQueuesAt: number | null;
}): LifecycleView {
  if (!matchId) {
    return {
      title: "Waiting for Today Match",
      description:
        "HuMob is checking whether today's Daily Match is available.",
      metricLabel: null,
      metricValue: null,
      icon: RefreshCw,
      animated: true,
      tone: "zinc",
    };
  }

  if (status === "open") {
    if (
      inputClosesAt !== null &&
      estimatedNow >= inputClosesAt
    ) {
      return {
        title: "Synchronizing Input Lock",
        description:
          "The input deadline has passed. HuMob is refreshing the match status.",
        metricLabel: null,
        metricValue: null,
        icon: LoaderCircle,
        animated: true,
        tone: "amber",
      };
    }

    return {
      title: "Activity Input Open",
      description:
        "You can still add, edit, or remove today's activities.",
      metricLabel:
        inputClosesAt !== null
          ? "Input closes in"
          : null,
      metricValue:
        inputClosesAt !== null
          ? formatRemainingTime(
              inputClosesAt - estimatedNow,
            )
          : null,
      icon: Clock3,
      animated: false,
      tone: "emerald",
    };
  }

  if (status === "locked") {
    if (
      ratingQueuesAt !== null &&
      estimatedNow >= ratingQueuesAt
    ) {
      return {
        title: "Waiting for Rating Queue",
        description:
          "The rating queue time has arrived. HuMob is synchronizing the scheduler result.",
        metricLabel: null,
        metricValue: null,
        icon: LoaderCircle,
        animated: true,
        tone: "blue",
      };
    }

    return {
      title: "Activity Input Closed",
      description:
        "Today's activity records are read-only and ready for rating.",
      metricLabel:
        ratingQueuesAt !== null
          ? "Rating starts in"
          : null,
      metricValue:
        ratingQueuesAt !== null
          ? formatRemainingTime(
              ratingQueuesAt - estimatedNow,
            )
          : null,
      icon: LockKeyhole,
      animated: false,
      tone: "amber",
    };
  }

  if (status === "queued") {
    return {
      title: "Waiting for Daily Rating",
      description:
        "The secure dispatcher has queued this match for evaluation.",
      metricLabel: "Status",
      metricValue: "Queued",
      icon: LoaderCircle,
      animated: true,
      tone: "blue",
    };
  }

  if (status === "processing") {
    return {
      title: "Calculating Performance",
      description:
        "HuMob is processing the logic score and AI-assisted rating.",
      metricLabel: "Status",
      metricValue: "Processing",
      icon: LoaderCircle,
      animated: true,
      tone: "violet",
    };
  }

  if (status === "rated") {
    return {
      title: "Daily Rating Ready",
      description:
        "The rating has been finalized and the dashboard data is up to date.",
      metricLabel: "Status",
      metricValue: "Rated",
      icon: CheckCircle2,
      animated: false,
      tone: "emerald",
    };
  }

  if (status === "failed") {
    return {
      title: "Automatic Retry Scheduled",
      description:
        "The previous rating attempt did not finish. HuMob will retry automatically.",
      metricLabel: "Status",
      metricValue: "Retrying",
      icon: TriangleAlert,
      animated: false,
      tone: "red",
    };
  }

  return {
    title: "Synchronizing Match",
    description:
      "HuMob is checking the latest Daily Match lifecycle state.",
    metricLabel: null,
    metricValue: null,
    icon: RefreshCw,
    animated: true,
    tone: "zinc",
  };
}

export function DailyMatchLiveStatus({
  matchId,
  matchDate,
  timeZone,
  status,
  inputClosesAt,
  ratingQueuesAt,
  serverNow,
  variant = "panel",
  className = "",
}: DailyMatchLiveStatusProps) {
  const router = useRouter();

  const [
    isRefreshPending,
    startRefreshTransition,
  ] = useTransition();

  const parsedServerNow = useMemo(() => {
    const timestamp = Date.parse(serverNow);

    return Number.isFinite(timestamp)
      ? timestamp
      : 0;
  }, [serverNow]);

  const [estimatedNow, setEstimatedNow] =
    useState(parsedServerNow);

  const serverOffsetRef = useRef(0);
  const estimatedNowRef = useRef(
    parsedServerNow,
  );

  const lastRefreshAtRef = useRef(0);

  const normalizedStatus = isKnownStatus(
    status,
  )
    ? status
    : null;

  const inputClosesAtTimestamp =
    parseTimestamp(inputClosesAt);

  const ratingQueuesAtTimestamp =
    parseTimestamp(ratingQueuesAt);

  const refresh = useCallback(() => {
    const browserNow = Date.now();

    /*
     * Menahan refresh ganda dari timeout,
     * polling, focus, dan visibility event.
     */
    if (
      browserNow -
        lastRefreshAtRef.current <
      2_500
    ) {
      return;
    }

    lastRefreshAtRef.current = browserNow;

    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    const nextServerNow = Date.parse(
      serverNow,
    );

    if (!Number.isFinite(nextServerNow)) {
      return;
    }

    serverOffsetRef.current =
      nextServerNow - Date.now();

    estimatedNowRef.current =
      nextServerNow;

    setEstimatedNow(nextServerNow);
  }, [serverNow]);

  useEffect(() => {
    const updateClock = () => {
      const nextEstimatedNow =
        Date.now() +
        serverOffsetRef.current;

      estimatedNowRef.current =
        nextEstimatedNow;

      setEstimatedNow(nextEstimatedNow);
    };

    updateClock();

    const intervalId = window.setInterval(
      updateClock,
      1_000,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  /*
   * Refresh presisi ketika deadline lifecycle tercapai.
   */
  useEffect(() => {
    let deadline: number | null = null;

    if (normalizedStatus === "open") {
      deadline = inputClosesAtTimestamp;
    }

    if (normalizedStatus === "locked") {
      deadline = ratingQueuesAtTimestamp;
    }

    if (deadline === null) {
      return;
    }

    const estimatedCurrentTime =
      Date.now() +
      serverOffsetRef.current;

    const delay =
      deadline > estimatedCurrentTime
        ? deadline -
          estimatedCurrentTime +
          1_500
        : 5_000;

    const safeDelay = Math.min(
      Math.max(delay, 750),
      2_147_483_647,
    );

    const timeoutId = window.setTimeout(
      refresh,
      safeDelay,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    normalizedStatus,
    inputClosesAtTimestamp,
    ratingQueuesAtTimestamp,
    serverNow,
    refresh,
  ]);

  /*
   * Polling ringan berdasarkan fase lifecycle.
   */
  useEffect(() => {
    const interval =
      getPollingInterval(
        matchId,
        normalizedStatus,
      );

    if (interval === null) {
      return;
    }

    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState !==
            "visible" ||
          !navigator.onLine
        ) {
          return;
        }

        /*
         * Sesudah rated, tidak perlu mengecek rating
         * terus-menerus. Refresh hanya saat tanggal
         * lokal telah berganti.
         */
        if (
          normalizedStatus === "rated" &&
          matchDate
        ) {
          const currentDate =
            getDateKeyForTimeZone(
              estimatedNowRef.current,
              timeZone,
            );

          if (
            currentDate === null ||
            currentDate === matchDate
          ) {
            return;
          }
        }

        refresh();
      },
      interval,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    matchId,
    matchDate,
    timeZone,
    normalizedStatus,
    refresh,
  ]);

  /*
   * Browser yang kembali aktif harus langsung
   * menyinkronkan status terbaru.
   */
  useEffect(() => {
    const shouldRefreshCurrentPage = () => {
      if (!matchId) {
        return true;
      }

      if (normalizedStatus !== "rated") {
        return true;
      }

      if (!matchDate) {
        return false;
      }

      const currentDate =
        getDateKeyForTimeZone(
          estimatedNowRef.current,
          timeZone,
        );

      return (
        currentDate !== null &&
        currentDate !== matchDate
      );
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
          "visible" &&
        shouldRefreshCurrentPage()
      ) {
        refresh();
      }
    };

    const handleWindowFocus = () => {
      if (shouldRefreshCurrentPage()) {
        refresh();
      }
    };

    const handleOnline = () => {
      if (shouldRefreshCurrentPage()) {
        refresh();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    window.addEventListener(
      "online",
      handleOnline,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );

      window.removeEventListener(
        "online",
        handleOnline,
      );
    };
  }, [
    matchId,
    matchDate,
    timeZone,
    normalizedStatus,
    refresh,
  ]);

  const view = getLifecycleView({
    matchId,
    status: normalizedStatus,
    estimatedNow,
    inputClosesAt:
      inputClosesAtTimestamp,
    ratingQueuesAt:
      ratingQueuesAtTimestamp,
  });

  const Icon = view.icon;
  const colors = toneClasses[view.tone];

  const layoutClass =
    variant === "compact"
      ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      : "flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between";

  const paddingClass =
    variant === "compact"
      ? "p-4"
      : "p-5";

  return (
    <section
      aria-live="polite"
      className={[
        "rounded-xl border",
        colors.container,
        paddingClass,
        className,
      ].join(" ")}
    >
      <div className={layoutClass}>
        <div className="flex items-start gap-3">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              colors.icon,
            ].join(" ")}
          >
            <Icon
              className={[
                "h-5 w-5",
                view.animated
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={[
                  "font-medium",
                  colors.title,
                ].join(" ")}
              >
                {view.title}
              </h2>

              {isRefreshPending ? (
                <span className="text-xs text-zinc-500">
                  Refreshing…
                </span>
              ) : null}
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
              {view.description}
            </p>
          </div>
        </div>

        {view.metricLabel &&
        view.metricValue ? (
          <div
            className={
              variant === "compact"
                ? "sm:text-right"
                : "min-w-40 sm:text-right"
            }
          >
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              {view.metricLabel}
            </p>

            <p
              className={[
                "mt-1 font-mono text-lg font-semibold tabular-nums",
                colors.metric,
              ].join(" ")}
            >
              {view.metricValue}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}