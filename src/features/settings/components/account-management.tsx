"use client";

import { AlertTriangle, Loader2, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { logoutAction, requestAccountDeletionAction } from "@/features/settings/actions";
import { SettingsSection } from "@/features/settings/components/settings-section";

export function AccountManagement() {
  const router = useRouter();
  const [isLogoutPending, startLogoutTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  };

  const handleDeleteRequest = () => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await requestAccountDeletionAction();

      if (result.success) {
        setShowDeleteConfirm(false);
        setDeleteRequested(true);
      } else {
        setDeleteError(result.error);
      }
    });
  };

  return (
    <SettingsSection
      title="Manajemen Akun"
      description="Keluar atau ajukan permintaan penghapusan akun."
    >
      {/* Logout */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div>
          <p className="text-sm font-medium text-white">Keluar</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Akhiri sesi aktif di perangkat ini.
          </p>
        </div>

        <button
          id="settings-logout"
          type="button"
          onClick={handleLogout}
          disabled={isLogoutPending}
          className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLogoutPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Keluar
        </button>
      </div>

      {/* Delete Account */}
      <div className="border-t border-white/5 pt-4">
        {deleteRequested ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-300">
              Permintaan penghapusan akun dikirim.
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Tim HuMob akan memproses permintaan Anda dalam 7 hari kerja. Anda
              masih dapat menggunakan akun hingga proses selesai.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-red-400">Hapus Akun</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Ajukan permintaan penghapusan akun secara permanen.
                </p>
              </div>

              <button
                id="settings-delete-account"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Akun
              </button>
            </div>

            {/* Confirmation dialog */}
            {showDeleteConfirm && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-confirm-title"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
              >
                <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-zinc-950 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <h3
                      id="delete-confirm-title"
                      className="text-base font-semibold text-white"
                    >
                      Hapus Akun?
                    </h3>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    Tindakan ini akan mengajukan permintaan penghapusan akun Anda.
                    Data akan dihapus secara permanen setelah diproses oleh tim
                    HuMob. Anda tidak dapat membatalkan akun yang telah dihapus.
                  </p>

                  {deleteError && (
                    <p className="mt-3 text-sm text-red-400">{deleteError}</p>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button
                      id="delete-confirm-cancel"
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteError(null);
                      }}
                      className="flex-1 rounded-xl border border-white/8 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/15"
                    >
                      Batal
                    </button>

                    <button
                      id="delete-confirm-proceed"
                      type="button"
                      onClick={handleDeleteRequest}
                      disabled={isDeletePending}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeletePending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Ya, Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SettingsSection>
  );
}
