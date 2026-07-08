"use client";

import { FilterBar } from "@/components/ui/filter-bar";

interface RequestFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: string;
  onStatusChange?: (status: string) => void;
}

const statusOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "Draft", label: "پیش‌نویس" },
  { value: "Pending", label: "در انتظار بررسی" },
  { value: "InProgress", label: "در حال انجام" },
  { value: "Approved", label: "تأیید شده" },
  { value: "Rejected", label: "رد شده" },
  { value: "Completed", label: "تکمیل شده" },
  { value: "Cancelled", label: "لغو شده" },
];

export function RequestFilters({ search, onSearchChange, status = "", onStatusChange }: RequestFiltersProps) {
  return (
    <FilterBar search={search} onSearchChange={onSearchChange} searchPlaceholder="جستجوی درخواست خرید...">
      {onStatusChange && (
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            dir="rtl"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-graphite-plate">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </FilterBar>
  );
}
