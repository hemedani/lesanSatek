"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "./colors";
import { Receipt } from "lucide-react";

interface BudgetLine {
  _id: string;
  code: string;
  title: string;
  totalAllocated: number;
  totalEncumbered?: number;
  totalSpent?: number;
  remainingBudget: number;
}

interface Props {
  data: BudgetLine[];
}

export function BudgetLineBreakdown({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">تفکیک ردیف‌های بودجه</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fog/50 py-8 text-center">ردیف بودجه‌ای ثبت نشده است</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">تفکیک ردیف‌های بودجه</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 6).map((line) => {
            const spent = line.totalSpent ?? 0;
            const pct = line.totalAllocated > 0
              ? Math.round((spent / line.totalAllocated) * 100)
              : 0;
            return (
              <div key={line._id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-moonlight truncate">
                      {line.title}
                    </p>
                    <p className="text-[10px] text-fog/40">{line.code}</p>
                  </div>
                  <span className="text-xs text-fog/60 shrink-0 me-2" dir="ltr">
                    {formatCurrency(line.totalAllocated)}
                  </span>
                  <span className="text-[10px] text-fog/50 shrink-0 w-8 text-left">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden ring-1 ring-inset ring-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-electric-iris to-ember"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {data.length > 6 && (
            <p className="text-[10px] text-fog/40 text-center pt-1">
              + {data.length - 6} ردیف دیگر
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
