import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Menggabungkan class Tailwind secara aman.
 *
 * clsx menangani conditional classes, sedangkan
 * tailwind-merge menyelesaikan class Tailwind yang bertabrakan.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}