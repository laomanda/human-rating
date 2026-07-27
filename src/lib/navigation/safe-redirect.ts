const INTERNAL_ORIGIN = "https://humob.local";

/**
 * Menghasilkan path internal yang aman untuk redirect.
 *
 * Menolak:
 * - URL absolut eksternal
 * - protocol-relative URL
 * - backslash
 * - control characters
 */
export function getSafeInternalPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }

  if (
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(
      value,
      INTERNAL_ORIGIN,
    );

    if (parsed.origin !== INTERNAL_ORIGIN) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}