"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
  trend?: { value: number; positive?: boolean };
}

export function KpiMetricCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-electric-iris",
  iconBg = "bg-electric-iris/10",
  subtitle,
  trend,
}: KpiMetricCardProps) {
  return (
    <Card variant="glass" className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 flex-1">
            <p className="text-xs font-medium text-fog/60 tracking-wide leading-5">{label}</p>
            <p className="text-2xl font-semibold text-glacier leading-9" dir="ltr">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-fog/50 leading-5 pt-0.5">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className={`text-xs font-medium ${
                    trend.positive ? "text-emerald-400" : "text-ember"
                  }`}
                >
                  {trend.positive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-[10px] text-fog/40">نسبت به ماه قبل</span>
              </div>
            )}
          </div>
          <div
            className={`flex size-12 items-center justify-center rounded-xl ${iconBg} ring-1 ring-inset ring-white/[0.06] shrink-0`}
          >
            <Icon className={`size-5 ${iconColor}`} />
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
      </CardContent>
    </Card>
  );
}
