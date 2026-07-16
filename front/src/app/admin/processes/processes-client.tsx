"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Workflow, Copy, CheckCircle2, XCircle, Trash2, Clock, FileText, Share2, List, BarChart3, Target } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { remove } from "@/app/actions/process/remove";
import { activateProcess } from "@/app/actions/process/activateProcess";
import { duplicateProcess } from "@/app/actions/process/duplicateProcess";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface Process {
  _id: string;
  name?: string;
  description?: string;
  status?: string;
  version?: number;
  isActive?: boolean;
  createdAt?: string;
  organization?: { _id: string; name?: string };
  createdBy?: { _id: string; first_name?: string; last_name?: string };
  unit?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareGroup?: { _id: string; name?: string };
  wareModel?: { _id: string; name?: string };
  ware?: { _id: string; name?: string };
}

interface ProcessesClientProps {
  items: Process[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

function hasScope(item: Process): boolean {
  return !!(item.unit || item.wareType || item.wareClass || item.wareGroup || item.wareModel || item.ware);
}

function getScopeLabel(item: Process): string {
  if (item.unit?.name) return `واحد: ${item.unit.name}`;
  if (item.ware?.name) return `کالا: ${item.ware.name}`;
  if (item.wareModel?.name) return `مدل: ${item.wareModel.name}`;
  if (item.wareGroup?.name) return `گروه: ${item.wareGroup.name}`;
  if (item.wareClass?.name) return `رده: ${item.wareClass.name}`;
  if (item.wareType?.name) return `نوع: ${item.wareType.name}`;
  return "عمومی";
}

const statusLabels: Record<string, { label: string; variant: "active" | "inactive" | "pending" | "info" }> = {
  Draft: { label: "پیش‌نویس", variant: "inactive" },
  Active: { label: "فعال", variant: "active" },
  Archived: { label: "بایگانی", variant: "pending" },
};

export function ProcessesClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: ProcessesClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Process | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/processes?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/processes");
    }
  };

  const handleActivate = async (process: Process) => {
    const result = await activateProcess({ activeRoleId: getActiveRoleIdFromStore(), _id: process._id });
    if (result.success) {
      toast.success("فرآیند با موفقیت فعال شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در فعال‌سازی فرآیند");
    }
  };

  const handleDuplicate = async (process: Process) => {
    const name = `${process.name || "فرآیند"} (کپی)`;
    const result = await duplicateProcess({ activeRoleId: getActiveRoleIdFromStore(), _id: process._id, name });
    if (result.success) {
      toast.success("فرآیند با موفقیت کپی شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در کپی فرآیند");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("فرآیند با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف فرآیند");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const statusIcon = (status?: string) => {
    switch (status) {
      case "Active": return <CheckCircle2 className="size-4 text-emerald-400" />;
      case "Archived": return <Clock className="size-4 text-fog/50" />;
      default: return <FileText className="size-4 text-amber-400" />;
    }
  };

  const columns: Column<Process>[] = [
    {
      key: "name",
      label: "نام",
      render: (item) => (
        <Link
          href={`/admin/processes/${item._id}`}
          className="text-moonlight hover:text-electric-iris transition-colors font-medium"
        >
          {item.name || "—"}
        </Link>
      ),
    },
    {
      key: "status",
      label: "وضعیت",
      render: (item) => {
        const info = statusLabels[item.status || ""] || { label: item.status || "—", variant: "inactive" as const };
        return <StatusBadge status={info.variant} label={info.label} />;
      },
    },
    {
      key: "version",
      label: "نسخه",
      render: (item) => (
        <span className="text-fog text-sm font-mono">v{item.version || 1}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "isActive",
      label: "فعال",
      render: (item) => (
        <StatusBadge
          status={item.isActive ? "active" : "inactive"}
          label={item.isActive ? "فعال" : "غیرفعال"}
        />
      ),
    },
    {
      key: "organization",
      label: "سازمان",
      render: (item) => (
        <span className="text-fog text-sm">{item.organization?.name || "—"}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "scope",
      label: "حوزه کاربرد",
      render: (item) => {
        const scope = getScopeLabel(item);
        return (
          <div className="flex items-center gap-1.5">
            <Target className="size-3 text-fog/40" />
            <span className="text-fog text-sm">{scope}</span>
          </div>
        );
      },
      hideOnCard: true,
    },
    {
      key: "createdBy",
      label: "ایجادکننده",
      render: (item) => (
        <span className="text-moonlight text-sm">
          {item.createdBy ? `${item.createdBy.first_name} ${item.createdBy.last_name}` : "—"}
        </span>
      ),
      hideOnCard: true,
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
        <div className="flex items-center gap-1">
          <Link href={`/admin/processes/${item._id}`}>
            <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100" title="ویرایش">
              <Pencil className="size-3.5" />
            </Button>
          </Link>
          <Link href={`/admin/processes/${item._id}/graph`}>
            <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 text-fog/60 hover:text-electric-iris" title="نمودار">
              <BarChart3 className="size-3.5" />
            </Button>
          </Link>
          <Link href={`/admin/processes/${item._id}/steps`}>
            <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 text-fog/60 hover:text-frost-link" title="گام‌ها">
              <List className="size-3.5" />
            </Button>
          </Link>
          <Link href={`/admin/processes/${item._id}/relations`}>
            <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 text-fog/60 hover:text-amber-400" title="روابط">
              <Share2 className="size-3.5" />
            </Button>
          </Link>
          {item.status === "Draft" && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-60 group-hover/row:opacity-100 text-fog/60 hover:text-emerald-400"
              onClick={() => handleActivate(item)}
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-60 group-hover/row:opacity-100 text-fog/60 hover:text-frost-link"
            onClick={() => handleDuplicate(item)}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-60 group-hover/row:opacity-100 text-fog/60 hover:text-destructive"
            onClick={() => setDeleteTarget(item)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="فرآیندها"
          description="مدیریت فرآیندهای خرید سازمان"
        >
          <Link href="/admin/processes/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              فرآیند جدید
            </Button>
          </Link>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی فرآیند..."
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={cardView}
        onViewToggle={() => setCardView((v) => !v)}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-electric-iris/10 border border-electric-iris/15 flex items-center justify-center shrink-0">
                  <Workflow className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/admin/processes/${item._id}`}
                    className="text-base font-semibold text-moonlight hover:text-electric-iris transition-colors leading-6 truncate block"
                  >
                    {item.name || "—"}
                  </Link>
                  <div className="flex items-center gap-2">
                    {statusIcon(item.status)}
                    <span className="text-xs text-fog/60">
                      {statusLabels[item.status || ""]?.label || item.status || "—"}
                    </span>
                    <span className="text-xs text-fog/40">•</span>
                    <span className="text-xs text-fog/50 font-mono">v{item.version || 1}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge
                  status={item.isActive ? "active" : "inactive"}
                  label={item.isActive ? "فعال" : "غیرفعال"}
                />
                {item.organization && (
                  <span className="text-[10px] text-fog/40">{item.organization.name}</span>
                )}
                {hasScope(item) && (
                  <span className="text-[10px] text-electric-iris/60">{getScopeLabel(item)}</span>
                )}
              </div>
            </div>
            {item.description && (
              <p className="mt-3 text-sm text-fog/60 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-steel-border/10">
              <div className="flex items-center gap-1">
                <Link href={`/admin/processes/${item._id}`}>
                  <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-moonlight" title="ویرایش">
                    <Pencil className="size-3.5" />
                  </Button>
                </Link>
                <Link href={`/admin/processes/${item._id}/graph`}>
                  <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-electric-iris" title="نمودار">
                    <BarChart3 className="size-3.5" />
                  </Button>
                </Link>
                <Link href={`/admin/processes/${item._id}/steps`}>
                  <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-frost-link" title="گام‌ها">
                    <List className="size-3.5" />
                  </Button>
                </Link>
                <Link href={`/admin/processes/${item._id}/relations`}>
                  <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-amber-400" title="روابط">
                    <Share2 className="size-3.5" />
                  </Button>
                </Link>
                {item.status === "Draft" && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-fog/60 hover:text-emerald-400"
                    title="فعال‌سازی"
                    onClick={() => handleActivate(item)}
                  >
                    <CheckCircle2 className="size-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-fog/60 hover:text-frost-link"
                  title="کپی"
                  onClick={() => handleDuplicate(item)}
                >
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-fog/60 hover:text-destructive"
                  title="حذف"
                  onClick={() => setDeleteTarget(item)}
                >
                  <XCircle className="size-3.5" />
                </Button>
              </div>
              {item.createdAt && (
                <span className="text-[10px] text-fog/40">
                  {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                </span>
              )}
            </div>
          </div>
        )}
        emptyTitle="فرآیندی یافت نشد"
        emptyDescription="هنوز هیچ فرآیندی ایجاد نشده است."
        emptyAction={
          <Link href="/admin/processes/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              ایجاد فرآیند
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
        title="حذف فرآیند"
        description={`آیا از حذف "${deleteTarget?.name || 'این فرآیند'}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
