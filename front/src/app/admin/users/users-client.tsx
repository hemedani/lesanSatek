"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, User, Trash2, Mail, Phone, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { removeUser } from "@/app/actions/user/removeUser";

interface UserItem {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  isActive?: boolean;
  position?: string;
  createdAt?: string;
  roles?: { roleId?: string; name?: string }[];
  organization?: { _id: string; name?: string };
}

interface UsersClientProps {
  items: UserItem[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const columns: Column<UserItem>[] = [
  {
    key: "name",
    label: "نام",
    render: (item) => (
      <Link
        href={`/admin/users/${item._id}`}
        className="text-moonlight hover:text-electric-iris transition-colors font-medium"
      >
        {item.first_name || ""} {item.last_name || ""}
      </Link>
    ),
  },
  {
    key: "email",
    label: "ایمیل",
    render: (item) => (
      <span className="text-pebble text-sm">{item.email || "—"}</span>
    ),
    hideOnCard: true,
  },
  {
    key: "mobile",
    label: "موبایل",
    render: (item) => (
      <span className="text-moonlight text-sm" dir="ltr">{item.mobile || "—"}</span>
    ),
  },
  {
    key: "roles",
    label: "نقش",
    render: (item) => (
      <div className="flex flex-wrap gap-1">
        {item.roles?.map((role, i) => (
          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
            {role.name === "Manager" ? "مدیر" :
             role.name === "Admin" ? "ادمین" :
             role.name === "OrgHead" ? "رئیس سازمان" :
             role.name === "UnitHead" ? "رئیس واحد" :
             role.name === "Employee" ? "کارمند" : "عادی"}
          </Badge>
        ))}
      </div>
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
    key: "actions",
    label: "",
    render: (item) => (
      <div className="flex items-center gap-1">
        <Link href={`/admin/users/${item._id}`}>
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200">
            <Pencil className="size-3.5" />
          </Button>
        </Link>
      </div>
    ),
  },
];

function getRoleLabel(name?: string): string {
  switch (name) {
    case "Manager": return "مدیر";
    case "Admin": return "ادمین";
    case "OrgHead": return "رئیس سازمان";
    case "UnitHead": return "رئیس واحد";
    case "Employee": return "کارمند";
    default: return "عادی";
  }
}

export function UsersClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: UsersClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/users?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/users");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await removeUser({ activeRoleId: "", _id: deleteTarget._id });
    if (result.success) {
      toast.success("کاربر با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف کاربر");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="کاربران"
          description="مدیریت کاربران سامانه"
        >
          <Link href="/admin/users/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              کاربر جدید
            </Button>
          </Link>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی کاربر..."
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
                  <User className="size-7 text-electric-iris" />
                </div>
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/admin/users/${item._id}`}
                    className="text-base font-semibold text-moonlight hover:text-electric-iris transition-colors leading-6 truncate block"
                  >
                    {item.first_name || ""} {item.last_name || ""}
                  </Link>
                  {item.position && (
                    <p className="text-sm text-fog/60 leading-5 truncate">{item.position}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge
                  status={item.isActive ? "active" : "inactive"}
                  label={item.isActive ? "فعال" : "غیرفعال"}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 pb-4 border-b border-steel-border/20 text-sm">
              {item.email && (
                <span className="flex items-center gap-1.5 text-fog/70">
                  <Mail className="size-3.5 text-fog/50" />
                  {item.email}
                </span>
              )}
              {item.mobile && (
                <span className="flex items-center gap-1.5 text-fog/70" dir="ltr">
                  <Phone className="size-3.5 text-fog/50" />
                  {item.mobile}
                </span>
              )}
              {item.roles && item.roles.length > 0 && (
                <span className="flex items-center gap-1.5 text-fog/70">
                  <Shield className="size-3.5 text-fog/50" />
                  {item.roles.map((r) => getRoleLabel(r.name)).join("، ")}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              {item.organization && (
                <span className="text-xs text-fog/50">{item.organization.name}</span>
              )}
              <div className="flex items-center gap-1 me-auto">
                <Link href={`/admin/users/${item._id}`}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-fog/60 hover:text-moonlight"
                    title="ویرایش"
                  >
                    <Pencil className="size-3.5" />
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
        emptyTitle="کاربری یافت نشد"
        emptyDescription="هنوز هیچ کاربری ایجاد نشده است."
        emptyAction={
          <Link href="/admin/users/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              ایجاد کاربر
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
        title="حذف کاربر"
        description={`آیا از حذف "${deleteTarget?.first_name || ''} ${deleteTarget?.last_name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
