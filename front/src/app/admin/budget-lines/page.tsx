"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator, Plus, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { gets } from "@/app/actions/budgetLine/gets";

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

export default function BudgetLinesPage() {
  const router = useRouter();
  const [items, setItems] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 30;

  const fetchItems = async (p: number) => {
    setLoading(true);
    const result = await gets({ activeRoleId: getActiveRoleIdFromStore(), page: p, limit }, { _id: 1, code: 1, title: 1, totalAllocated: 1, totalEncumbered: 1, totalSpent: 1, remainingBudget: 1 });
    if (result.success) setItems(result.body || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(page); }, [page]);

  const columns: Column<BudgetLine>[] = [
    { key: "code", label: "کد", render: (item) => (<div className="flex items-center gap-3"><Calculator className="size-4 text-electric-iris" /><span className="text-moonlight font-mono font-medium">{item.code || "—"}</span></div>) },
    { key: "title", label: "عنوان", render: (item) => <span className="text-fog text-sm">{item.title || "—"}</span> },
    { key: "totalAllocated", label: "تخصیص یافته", render: (item) => <span className="text-fog font-mono text-sm" dir="ltr">{item.totalAllocated?.toLocaleString("fa-IR") || "—"}</span> },
    { key: "remainingBudget", label: "باقی‌مانده", render: (item) => (<span className={cn("font-mono text-sm", (item.remainingBudget || 0) < 0 ? "text-rose-400" : "text-emerald-400")} dir="ltr">{item.remainingBudget?.toLocaleString("fa-IR") || "—"}</span>) },
    { key: "actions", label: "", render: (item) => <Button variant="ghost" size="icon-xs" onClick={() => router.push(`/admin/budget-lines/${item._id}`)}><ExternalLink className="size-3.5" /></Button> },
  ];

  if (loading && page === 1) return <div className="space-y-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="ردیف‌های بودجه" description="لیست ردیف‌های بودجه و مانده‌ها" />
      <DataTable columns={columns} data={items} keyExtractor={(i) => i._id} cardView={false} renderCard={(item) => (<div className="glass-card glass-card-hover-active rounded-xl p-4"><p className="font-semibold text-moonlight">{item.code} — {item.title}</p><div className="flex gap-4 mt-2 text-xs text-fog/50"><span>تخصیص: {item.totalAllocated?.toLocaleString("fa-IR")}</span><span>باقی: {item.remainingBudget?.toLocaleString("fa-IR")}</span></div></div>)} emptyTitle="ردیف بودجه‌ای یافت نشد" emptyDescription="هیچ ردیف بودجه‌ای ثبت نشده است." />
      <Pagination prevUrl={page > 1 ? "#" : ""} nextUrl={items.length >= limit ? "#" : ""} page={page} />
    </div>
  );
}
