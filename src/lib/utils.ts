import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatToman(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

export function formatPercent(amount: number): string {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(amount)}%`;
}
