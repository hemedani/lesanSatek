"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge";
import { RequestCard } from "@/components/purchasing/request-card";
import { RequestFilters } from "@/components/purchasing/request-filters";

interface Process {
  _id: string;
  name?: string;
}

interface PurchasingRequest {
  _id: string;
  title?: string;
  status?: string;
  estimatedAmount?: number;
  quantity?: number;
  currentStep?: number;
  createdAt?: string;
  process?: Process;
}

interface PurchasingRequestsClientProps {
  items: PurchasingRequest[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
  statusFilter?: string;
}

export function PurchasingRequestsClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
  statusFilter = "",
}: PurchasingRequestsClientProps) {
  const router = useRouter();

  const handleSearch = useCallback((value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (statusFilter) params.set("status", statusFilter);
    router.push(`/admin/purchasing-requests${params.toString() ? `?${params.toString()}` : ""}`);
  }, [router, statusFilter]);

  const handleStatusFilter = useCallback((status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    router.push(`/admin/purchasing-requests${params.toString() ? `?${params.toString()}` : ""}`);
  }, [router, search]);

  const columns: Column<PurchasingRequest>[] = [
    {
      key: "title",
      label: "عنوان",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <ShoppingCart className="size-3.5 text-electric-iris" />
          </div>
          <div className="min-w-0">
            <span className="text-moonlight font-medium">{item.title || "—"}</span>
            {item.process?.name && (
              <p className="text-fog/50 text-xs mt-0.5">{item.process.name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "وضعیت",
      render: (item) => <RequestStatusBadge status={item.status} />,
    },
    {
      key: "estimatedAmount",
      label: "مبلغ تخمینی",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.estimatedAmount != null ? item.estimatedAmount.toLocaleString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "تعداد",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ ایجاد",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200"
          onClick={() => router.push(`/admin/purchasing-requests/${item._id}`)}
        >
          <ShoppingCart className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="درخواست‌های خرید"
          description="مدیریت و پیگیری درخواست‌های خرید"
        >
          <Button size="sm" className="gap-1.5" onClick={() => router.push("/admin/purchasing-requests/new")}>
            <Plus className="size-4" />
            درخواست خرید جدید
          </Button>
        </PageHeader>
      </div>

      <RequestFilters
        search={search}
        onSearchChange={handleSearch}
        status={statusFilter}
        onStatusChange={handleStatusFilter}
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={false}
        renderCard={(item) => (
          <RequestCard
            title={item.title}
            status={item.status}
            estimatedAmount={item.estimatedAmount}
            quantity={item.quantity}
            processName={item.process?.name}
            createdAt={item.createdAt}
            onClick={() => router.push(`/admin/purchasing-requests/${item._id}`)}
          />
        )}
        emptyTitle="درخواست خریدی یافت نشد"
        emptyDescription="هنوز هیچ درخواست خریدی ثبت نشده است."
        emptyAction={
          <Button size="sm" className="gap-1.5" onClick={() => router.push("/admin/purchasing-requests/new")}>
            <Plus className="size-4" />
            ایجاد درخواست خرید
          </Button>
        }
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </div>
  );
}
