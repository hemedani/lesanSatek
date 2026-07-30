export const CHART_COLORS = {
  iris: "#663af3",
  azure: "#027dea",
  mint: "#269684",
  ember: "#e46d4c",
  ice: "#d1e4fa",
  frost: "#b6d9fc",
  emerald: "#34d399",
  amber: "#fbbf24",
  moonlight: "#c7d3ea",
  fog: "#81899b",
  rose: "#fb7185",
  violet: "#8b5cf6",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: CHART_COLORS.fog,
  pending: CHART_COLORS.amber,
  inProgress: CHART_COLORS.azure,
  approved: CHART_COLORS.mint,
  pendingFinalization: CHART_COLORS.violet,
  rejected: CHART_COLORS.ember,
  completed: CHART_COLORS.emerald,
  cancelled: CHART_COLORS.rose,
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار بررسی",
  inProgress: "در حال انجام",
  approved: "تأیید شده",
  pendingFinalization: "در انتظار تأیید نهایی",
  rejected: "رد شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
};

export const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر",
  "مرداد", "شهریور", "مهر", "آبان",
  "آذر", "دی", "بهمن", "اسفند",
];

export function formatCurrency(value: number): string {
  return value.toLocaleString("fa-IR");
}
