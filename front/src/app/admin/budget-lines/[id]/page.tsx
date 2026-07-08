"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { get } from "@/app/actions/budgetLine/get";

interface BudgetLine {
  _id: string;
  code?: string;
  title?: string;
  description?: string;
  totalAllocated?: number;
  totalEncumbered?: number;
  totalSpent?: number;
  remainingBudget?: number;
}

export default function BudgetLineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<BudgetLine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await get({ _id: id }, { _id: 1, code: 1, title: 1, description: 1, totalAllocated: 1, totalEncumbered: 1, totalSpent: 1, remainingBudget: 1 });
      if (result.success && result.body?.[0]) setItem(result.body[0]);
      else { toast.error("ردیف بودجه یافت نشد"); router.push("/admin/budget-lines"); }
      setLoading(false);
    })();
  }, [id, router]);

  if (loading) return <div className="space-y-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (!item) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-steel-border/50">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/admin/budget-lines")} className="rounded-lg"><ArrowRight className="size-4" /></Button>
        <div><h1 className="text-xl font-semibold text-moonlight tracking-tight">{item.code} — {item.title}</h1></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "تخصیص یافته", value: item.totalAllocated, color: "text-frost-link" },
          { label: "تعهد شده", value: item.totalEncumbered, color: "text-amber-400" },
          { label: "مصرف شده", value: item.totalSpent, color: "text-rose-400" },
          { label: "باقی‌مانده", value: item.remainingBudget, color: (item.remainingBudget || 0) < 0 ? "text-rose-400" : "text-emerald-400" },
        ].map((stat) => (
          <Card key={stat.label} variant="glass">
            <CardContent className="p-5 text-center">
              <p className="text-xs text-fog/50 mb-1">{stat.label}</p>
              <p className={cn("text-lg font-semibold font-mono", stat.color)} dir="ltr">{stat.value?.toLocaleString("fa-IR") || "۰"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {item.description && (
        <Card variant="glass">
          <CardHeader><CardTitle>توضیحات</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-moonlight/80">{item.description}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
