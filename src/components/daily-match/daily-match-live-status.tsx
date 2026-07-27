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

import { getDateKeyForTimeZone } from "@/features/dashboard/formatters";

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

const KNOWN_STATUSES: readonly DailyMatchLifecycleStatus[] =
  [
    "open",
    "locked",
    "queued",
    "processing",
    "rated",
    "failed",
  ];

const TONE_CLASSES: Record<
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
    icon:
      "bg-emerald-400/10 text-emerald-300",
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
    icon:
      "bg-violet-400/10 text-violet-300",
    title: "text-violet-200",
    metric: "text-violet-300",
  },
  zinc: {
    container:
      "border-white/10 bg-white/[0.02]",
    icon: "bg-white/5 text-zinc-400",
    title: "text-zinc-200",
    metric: "text-zinc-300",
  },
  red: {
    container:
      "border-red-400/20 bg-red-400/5",
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
  const totalSeconds = Math.floor(
    Math.max(0, milliseconds) / 1000,
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

function getPollingInterval(
  matchId: string | null,
  status: DailyMatchLifecycleStatus | null,
): number {
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
      title: "Menunggu Daily Match",
      description:
        "HuMob sedang memeriksa Daily Match hari ini.",
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
        title: "Menyinkronkan penutupan input",
        description:
          "Batas waktu input telah lewat. HuMob sedang memperbarui status Daily Match.",
        metricLabel: null,
        metricValue: null,
        icon: LoaderCircle,
        animated: true,
        tone: "amber",
      };
    }

    return {
      title: "Input aktivitas terbuka",
      description:
        "Aktivitas hari ini masih dapat ditambah, diubah, atau dihapus.",
      metricLabel:
        inputClosesAt !== null
          ? "Input ditutup dalam"
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
        title: "Menunggu antrean rating",
        description:
          "Waktu penilaian telah tiba. HuMob sedang menyinkronkan hasil scheduler.",
        metricLabel: null,
        metricValue: null,
        icon: LoaderCircle,
        animated: true,
        tone: "blue",
      };
    }

    return {
      title: "Input aktivitas ditutup",
      description:
        "Aktivitas hari ini hanya dapat dilihat dan siap untuk dinilai.",
      metricLabel:
        ratingQueuesAt !== null
          ? "Rating dimulai dalam"
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
      title: "Menunggu penilaian harian",
      description:
        "Daily Match telah masuk ke antrean penilaian.",
      metricLabel: "Status",
      metricValue: "Dalam antrean",
      icon: LoaderCircle,
      animated: true,
      tone: "blue",
    };
  }

  if (status === "processing") {
    return {
      title: "Menghitung performa",
      description:
        "HuMob sedang memproses logic score dan rating berbantuan AI.",
      metricLabel: "Status",
      metricValue: "Sedang diproses",
      icon: LoaderCircle,
      animated: true,
      tone: "violet",
    };
  }

  if (status === "rated") {
    return {
      title: "Rating harian tersedia",
      description:
        "Rating telah diselesaikan dan data Dashboard sudah diperbarui.",
      metricLabel: "Status",
      metricValue: "Selesai",
      icon: CheckCircle2,
      animated: false,
      tone: "emerald",
    };
  }

  if (status === "failed") {
    return {
      title: "Penilaian akan dicoba kembali",
      description:
        "Proses sebelumnya belum selesai. HuMob akan mencoba kembali secara otomatis.",
      metricLabel: "Status",
      metricValue: "Menunggu percobaan ulang",
      icon: TriangleAlert,
      animated: false,
      tone: "red",
    };
  }

  return {
    title: "Menyinkronkan Daily Match",
    description:
      "HuMob sedang memeriksa status Daily Match terbaru.",
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

  const parsedServerNow = useMemo(
    () => parseTimestamp(serverNow) ?? 0,
    [serverNow],
  );

  const [estimatedNow, setEstimatedNow] =
    useState(parsedServerNow);

  const serverOffsetRef = useRef(0);
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
    const nextServerNow =
      parseTimestamp(serverNow);

    if (nextServerNow !== null) {
      serverOffsetRef.current =
        nextServerNow - Date.now();
    }

    if (
      normalizedStatus !== "open" &&
      normalizedStatus !== "locked"
    ) {
      return;
    }

    const intervalId = window.setInterval(
      () => {
        setEstimatedNow(
          Date.now() +
            serverOffsetRef.current,
        );
      },
      1_000,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [serverNow, normalizedStatus]);

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

    const timeoutId = window.setTimeout(
      refresh,
      Math.min(
        Math.max(delay, 750),
        2_147_483_647,
      ),
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

  useEffect(() => {
    const interval = getPollingInterval(
      matchId,
      normalizedStatus,
    );

    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState !==
            "visible" ||
          !navigator.onLine
        ) {
          return;
        }

        if (
          normalizedStatus === "rated" &&
          matchDate
        ) {
          const currentDate =
            getDateKeyForTimeZone(
              new Date(
                Date.now() +
                  serverOffsetRef.current,
              ),
              timeZone,
            );

          if (currentDate === matchDate) {
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

  useEffect(() => {
    const shouldRefresh = () => {
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
          new Date(
            Date.now() +
              serverOffsetRef.current,
          ),
          timeZone,
        );

      return currentDate !== matchDate;
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
          "visible" &&
        shouldRefresh()
      ) {
        refresh();
      }
    };

    const handleFocus = () => {
      if (shouldRefresh()) {
        refresh();
      }
    };

    const handleOnline = () => {
      if (shouldRefresh()) {
        refresh();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "focus",
      handleFocus,
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
        handleFocus,
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
  const colors = TONE_CLASSES[view.tone];

  return (
    <section
      className={[
        "rounded-xl border",
        colors.container,
        variant === "compact"
          ? "p-4"
          : "p-5",
        className,
      ].join(" ")}
    >
      <span
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {view.title}
      </span>

      <div
        className={
          variant === "compact"
            ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              colors.icon,
            ].join(" ")}
          >
            <Icon
              aria-hidden="true"
              className={[
                "h-5 w-5",
                view.animated
                  ? "animate-spin motion-reduce:animate-none"
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
                  Memperbarui…
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