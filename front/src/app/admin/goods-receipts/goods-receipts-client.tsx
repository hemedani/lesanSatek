"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GoodsReceipt {
  _id: string;
  receiptNumber?: string;
  status?: string;
  description?: string;
  receivedAt?: string;
  createdAt?: string;
}

interface GoodsReceiptsClientProps {
  items: GoodsReceipt[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "در انتظار", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  completed: { label: "تکمیل شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  partially_rejected: { label: "رد جزئی", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export function GoodsReceiptsClient({ items, prevPageUrl, nextPageUrl, page, search = "" }: GoodsReceiptsClientProps) {
  const router = useRouter();

  const handleSearch = useCallback((value: string) => {
    router.push(`/admin/goods-receipts${value.trim() ? `?search=${encodeURIComponent(value.trim())}` : ""}`);
  }, [router]);

  const columns: Column<GoodsReceipt>[] = [
    {
      key: "receiptNumber",
      label: "شماره رسید",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <ClipboardList className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-mono font-medium">{item.receiptNumber || "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "وضعیت",
      render: (item) => {
        const config = statusConfig[item.status || ""] || statusConfig.pending;
        return <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5 font-medium", config.className)}>{config.label}</Badge>;
      },
    },
    {
      key: "description",
      label: "توضیحات",
      render: (item) => <span className="text-fog text-sm">{item.description || "—"}</span>,
    },
    {
      key: "receivedAt",
      label: "تاریخ رسید",
      render: (item) => (
        <span className="text-fog text-sm">{item.receivedAt ? new Date(item.receivedAt).toLocaleDateString("fa-IR") : "—"}</span>
      ),
      hideOnCard: true,
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader title="رسید کالا" description="مدیریت رسید کالاهای دریافتی">
          <Button size="sm" className="gap-1.5" onClick={() => router.push("/admin/goods-receipts/new")}>
            <Plus className="size-4" /> رسید جدید
          </Button>
        </PageHeader>
      </div>
      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی رسید کالا..." />
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={false}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <ClipboardList className="size-5 text-electric-iris" />
              <span className="font-semibold text-moonlight">{item.receiptNumber || "—"}</span>
            </div>
            {item.status && <Badge variant="outline" className={cn("text-[10px]", (statusConfig[item.status] || statusConfig.pending).className)}>{statusConfig[item.status]?.label || item.status}</Badge>}
          </div>
        )}
        emptyTitle="رسیدی یافت نشد"
        emptyDescription="هنوز هیچ رسید کالایی ثبت نشده است."
        emptyAction={<Button size="sm" className="gap-1.5" onClick={() => router.push("/admin/goods-receipts/new")}><Plus className="size-4" />ایجاد رسید</Button>}
      />
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </div>
  );
}
