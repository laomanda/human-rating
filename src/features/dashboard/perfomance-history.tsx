import { History } from "lucide-react";

import {
  formatDateOnly,
  formatScore,
  formatStatus,
} from "@/features/dashboard/formatters";
import type { DashboardHistoryItem } from "@/features/dashboard/types";

type PerformanceHistoryProps = {
  history: DashboardHistoryItem[];
};

export function PerformanceHistory({
  history,
}: PerformanceHistoryProps) {
  return (
    <section
      aria-labelledby="performance-history-title"
      className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          <History className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2
            id="performance-history-title"
            className="font-medium text-white"
          >
            Riwayat Performa Terbaru
          </h2>

          <p className="text-sm text-zinc-500">
            Maksimal 30 Daily Match terbaru beserta detail rating final.
          </p>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <caption className="sr-only">
              Riwayat Daily Match dan rating performa pengguna
            </caption>

            <thead>
              <tr className="border-b border-white/10 text-zinc-500">
                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Tanggal
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Overall
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Energy
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Focus
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Discipline
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Responsibility
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Status
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 font-medium"
                >
                  Input
                </th>
              </tr>
            </thead>

            <tbody>
              {history.map(({ match, rating }) => (
                <tr
                  key={match.id}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-3 py-4 text-zinc-300">
                    {formatDateOnly(match.match_date)}
                  </td>

                  <ScoreCell
                    value={rating?.overall_rating ?? null}
                    emphasized
                  />

                  <ScoreCell
                    value={rating?.energy_rating ?? null}
                  />

                  <ScoreCell
                    value={rating?.focus_rating ?? null}
                  />

                  <ScoreCell
                    value={rating?.discipline_rating ?? null}
                  />

                  <ScoreCell
                    value={
                      rating?.responsibility_rating ?? null
                    }
                  />

                  <td className="whitespace-nowrap px-3 py-4 text-zinc-400">
                    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-zinc-300">
                      {formatStatus(match.status)}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-zinc-400">
                    {match.input_item_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 flex min-h-44 items-center justify-center rounded-xl border border-dashed border-white/10">
          <div className="max-w-md px-6 text-center">
            <p className="font-medium text-zinc-300">
              Belum ada riwayat performa
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Riwayat akan muncul setelah Daily Match tersedia untuk akun ini.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ScoreCell({
  value,
  emphasized = false,
}: {
  value: number | null;
  emphasized?: boolean;
}) {
  return (
    <td
      className={`px-3 py-4 ${
        emphasized
          ? "font-semibold text-white"
          : "text-zinc-400"
      }`}
    >
      {formatScore(value)}
    </td>
  );
}