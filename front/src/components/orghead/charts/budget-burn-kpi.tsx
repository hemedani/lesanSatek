"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "./colors";
import { Landmark, TrendingDown, Calculator, Lock } from "lucide-react";

interface BudgetBurnDown {
  totalAllocated: number;
  totalEncumbered: number;
  totalSpent: number;
  totalRemaining: number;
}

interface Props {
  data: BudgetBurnDown;
}

export function BudgetBurnKpi({ data }: Props) {
  const utilizationPct = data.totalAllocated > 0
    ? Math.round((data.totalSpent / data.totalAllocated) * 100)
    : 0;

  const items = [
    {
      label: "بودجه کل",
      value: data.totalAllocated,
      icon: Landmark,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
    },
    {
      label: "مصرف شده",
      value: data.totalSpent,
      icon: TrendingDown,
      color: "text-ember",
      bg: "bg-ember/10",
      subtitle: `${utilizationPct}٪ از کل`,
    },
    {
      label: "تعهد شده",
      value: data.totalEncumbered,
      icon: Lock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "باقی‌مانده",
      value: data.totalRemaining,
      icon: Calculator,
      color: data.totalRemaining > 0 ? "text-emerald-400" : "text-ember",
      bg: data.totalRemaining > 0 ? "bg-emerald-400/10" : "bg-ember/10",
    },
  ];

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Landmark className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">خلاصه بودجه سازمان</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-steel-border/10"
              >
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${item.bg} ring-1 ring-inset ring-white/[0.06] shrink-0`}
                >
                  <Icon className={`size-4 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-fog/60 font-medium uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className={`text-sm font-semibold ${item.color} leading-5 truncate`} dir="ltr">
                    {formatCurrency(item.value)}
                  </p>
                  {item.subtitle && (
                    <p className="text-[10px] text-fog/40">{item.subtitle}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-fog/50">میزان مصرف بودجه</span>
            <span className="text-[10px] text-fog/50" dir="ltr">
              {utilizationPct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden ring-1 ring-inset ring-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric-iris to-ember transition-all duration-500"
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
      </CardContent>
    </Card>
  );
}
