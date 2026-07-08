"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Gavel, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { cn } from "@/lib/utils";

interface Tender {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  deadline?: string;
  createdAt?: string;
}

interface TendersClientProps {
  items: Tender[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
  statusFilter?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "باز", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  closed: { label: "بسته شده", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  awarded: { label: "اعطا شده", className: "bg-electric-iris/10 text-electric-iris border-electric-iris/20" },
  cancelled: { label: "لغو شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export function TendersClient({ items, prevPageUrl, nextPageUrl, page, search = "", statusFilter = "" }: TendersClientProps) {
  const router = useRouter();

  const handleSearch = useCallback((value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (statusFilter) params.set("status", statusFilter);
    router.push(`/admin/tenders${params.toString() ? `?${params.toString()}` : ""}`);
  }, [router, statusFilter]);

  const handleStatusFilter = useCallback((status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    router.push(`/admin/tenders${params.toString() ? `?${params.toString()}` : ""}`);
  }, [router, search]);

  const columns: Column<Tender>[] = [
    {
      key: "title",
      label: "عنوان",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Gavel className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-medium">{item.title || "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "وضعیت",
      render: (item) => {
        const config = statusConfig[item.status || ""] || statusConfig.open;
        return <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5 font-medium", config.className)}>{config.label}</Badge>;
      },
    },
    {
      key: "deadline",
      label: "مهلت",
      render: (item) => (
        <span className={cn("text-sm font-mono", new Date(item.deadline || "") < new Date() ? "text-rose-400/70" : "text-fog")} dir="ltr">
          {item.deadline ? new Date(item.deadline).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ ایجاد",
      render: (item) => (
        <span className="text-fog text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100" onClick={() => router.push(`/admin/tenders/${item._id}`)}>
          <ExternalLink className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader title="مناقصات" description="مدیریت مناقصات خرید">
        </PageHeader>
      </div>
      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی مناقصه..." />
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={false}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-4 cursor-pointer" onClick={() => router.push(`/admin/tenders/${item._id}`)}>
            <div className="flex items-center gap-3">
              <Gavel className="size-5 text-electric-iris" />
              <span className="font-semibold text-moonlight">{item.title || "—"}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-fog/50">
              {item.status && <Badge variant="outline" className={cn("text-[10px]", (statusConfig[item.status] || statusConfig.open).className)}>{statusConfig[item.status]?.label || item.status}</Badge>}
              {item.deadline && <span>مهلت: {new Date(item.deadline).toLocaleDateString("fa-IR")}</span>}
            </div>
          </div>
        )}
        emptyTitle="مناقصه‌ای یافت نشد"
        emptyDescription="هنوز هیچ مناقصه‌ای ثبت نشده است."
      />
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </div>
  );
}
