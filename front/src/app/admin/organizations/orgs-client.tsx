"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Building2, Calendar, Trash2, GitBranch, User, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { remove } from "@/app/actions/organization/remove";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface Organization {
  _id: string;
  name?: string;
  enName?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  head?: { _id: string; first_name?: string; last_name?: string };
}

interface OrganizationsClientProps {
  items: Organization[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const columns: Column<Organization>[] = [
  {
    key: "name",
    label: "نام",
    render: (item) => (
      <Link
        href={`/admin/organizations/${item._id}`}
        className="text-moonlight hover:text-electric-iris transition-colors font-medium"
      >
        {item.name || "—"}
      </Link>
    ),
  },
  {
    key: "enName",
    label: "نام انگلیسی",
    render: (item) => (
      <span className="text-pebble text-sm">{item.enName || "—"}</span>
    ),
    hideOnCard: true,
  },
  {
    key: "head",
    label: "رئیس",
    render: (item) => (
      <span className="text-moonlight">
        {item.head ? `${item.head.first_name} ${item.head.last_name}` : "—"}
      </span>
    ),
  },
  {
    key: "isActive",
    label: "وضعیت",
    render: (item) => (
      <StatusBadge
        status={item.isActive ? "active" : "inactive"}
        label={item.isActive ? "فعال" : "غیرفعال"}
      />
    ),
  },
  {
    key: "createdAt",
    label: "تاریخ ایجاد",
    render: (item) => (
      <span className="text-fog text-sm">
        {item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("fa-IR")
          : "—"}
      </span>
    ),
    hideOnCard: true,
  },
  {
    key: "actions",
    label: "",
    render: (item) => (
      <div className="flex items-center gap-1">
        <Link href={`/admin/organizations/${item._id}`}>
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200">
            <Pencil className="size-3.5" />
          </Button>
        </Link>
        <Link href={`/admin/organizations/${item._id}/relations`}>
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200" title="روابط">
            <Share2 className="size-3.5" />
          </Button>
        </Link>
      </div>
    ),
  },
];

export function OrganizationsClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: OrganizationsClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/organizations?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/organizations");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("سازمان با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف سازمان");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="سازمان‌ها"
          description="مدیریت سازمان‌های فعال در سامانه"
        >
          <Link href="/admin/organizations/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              سازمان جدید
            </Button>
          </Link>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی سازمان..."
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={cardView}
        onViewToggle={() => setCardView((v) => !v)}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-6 transition-all duration-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-14 rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15 flex items-center justify-center shrink-0 me-2">
                  <Building2 className="size-7 text-electric-iris" />
                </div>
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/admin/organizations/${item._id}`}
                    className="text-base font-semibold text-moonlight hover:text-electric-iris transition-colors leading-6 truncate block"
                  >
                    {item.name || "—"}
                  </Link>
                  {item.enName && (
                    <p className="text-sm text-fog/60 leading-5 truncate">{item.enName}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge
                  status={item.isActive ? "active" : "inactive"}
                  label={item.isActive ? "فعال" : "غیرفعال"}
                />
                {item.createdAt && (
                  <span className="flex items-center gap-1 text-xs text-fog/50 whitespace-nowrap">
                    <Calendar className="size-3" />
                    {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                )}
              </div>
            </div>

            {item.head && (
              <div className="flex items-center gap-2 mt-4 pb-4 border-b border-steel-border/20">
                <User className="size-4 text-fog/50 shrink-0" />
                <span className="text-sm text-fog/80">{item.head.first_name} {item.head.last_name}</span>
              </div>
            )}

            <div className="flex items-center justify-end mt-4">
              <div className="flex items-center gap-1">
                <Link href={`/admin/organizations/${item._id}`}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-fog/60 hover:text-moonlight"
                    title="ویرایش"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </Link>
                <Link href={`/admin/organizations/${item._id}`}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-fog/60 hover:text-frost-link"
                    title="واحدها"
                  >
                    <GitBranch className="size-3.5" />
                  </Button>
                </Link>
                <Link href={`/admin/organizations/${item._id}/relations`}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-fog/60 hover:text-frost-link"
                    title="روابط"
                  >
                    <Share2 className="size-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-fog/60 hover:text-destructive"
                  title="حذف"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
        emptyTitle="سازمانی یافت نشد"
        emptyDescription="هنوز هیچ سازمانی ایجاد نشده است."
        emptyAction={
          <Link href="/admin/organizations/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              ایجاد سازمان
            </Button>
          </Link>
        }
      />

      <Pagination
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف سازمان"
        description={`آیا از حذف "${deleteTarget?.name || 'این سازمان'}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
