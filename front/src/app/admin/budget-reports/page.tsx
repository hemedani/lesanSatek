"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { gets } from "@/app/actions/budgetLine/gets";

interface BudgetLine {
  _id: string;
  code?: string;
  title?: string;
  totalAllocated?: number;
  totalEncumbered?: number;
  totalSpent?: number;
  remainingBudget?: number;
}

export default function BudgetReportsPage() {
  const [items, setItems] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await gets({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 200 }, { _id: 1, code: 1, title: 1, totalAllocated: 1, totalEncumbered: 1, totalSpent: 1, remainingBudget: 1 });
      if (result.success) setItems(result.body || []);
      setLoading(false);
    })();
  }, []);

  const totalAllocated = items.reduce((s, i) => s + (i.totalAllocated || 0), 0);
  const totalEncumbered = items.reduce((s, i) => s + (i.totalEncumbered || 0), 0);
  const totalSpent = items.reduce((s, i) => s + (i.totalSpent || 0), 0);
  const totalRemaining = items.reduce((s, i) => s + (i.remainingBudget || 0), 0);

  if (loading) return <div className="space-y-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="گزارش بودجه" description="خلاصه وضعیت بودجه" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "کل تخصیص", value: totalAllocated, color: "text-frost-link" },
          { label: "کل تعهد", value: totalEncumbered, color: "text-amber-400" },
          { label: "کل مصرف", value: totalSpent, color: "text-rose-400" },
          { label: "باقی‌مانده", value: totalRemaining, color: totalRemaining < 0 ? "text-rose-400" : "text-emerald-400" },
        ].map((stat) => (
          <Card key={stat.label} variant="glass">
            <CardContent className="p-5">
              <p className="text-xs text-fog/50 mb-1">{stat.label}</p>
              <p className={cn("text-xl font-semibold font-mono", stat.color)} dir="ltr">{stat.value.toLocaleString("fa-IR")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card variant="glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="size-5 text-electric-iris" />
            <h3 className="text-sm font-semibold text-moonlight">ردیف‌های بودجه</h3>
          </div>
          <div className="space-y-2">
            {items.map((bl) => (
              <div key={bl._id} className="flex items-center justify-between py-2 border-b border-steel-border/10 last:border-b-0">
                <div className="min-w-0">
                  <p className="text-sm text-moonlight truncate">{bl.code} — {bl.title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <span className="text-frost-link">{bl.totalAllocated?.toLocaleString("fa-IR")}</span>
                  <span className="text-amber-400">{bl.totalEncumbered?.toLocaleString("fa-IR")}</span>
                  <span className="text-rose-400">{bl.totalSpent?.toLocaleString("fa-IR")}</span>
                  <span className={cn((bl.remainingBudget || 0) < 0 ? "text-rose-400" : "text-emerald-400")}>{bl.remainingBudget?.toLocaleString("fa-IR")}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
