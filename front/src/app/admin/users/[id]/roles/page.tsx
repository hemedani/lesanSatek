"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight, Shield, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form/form-card";
import { SearchSelect } from "@/components/form/form-search-select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getUser } from "@/app/actions/user/getUser";
import { addOrRemoveRoles } from "@/app/actions/user/addOrRemoveRoles";
import { gets as getOrganizations } from "@/app/actions/organization/gets";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { ROLE_OPTIONS } from "@/types/permissions";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface RoleEntry {
  roleId: string;
  name: string;
  scopeType?: string;
  scopeId?: string;
}

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
};

export default function UserRolesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<RoleEntry[]>([]);

  const [newRoleName, setNewRoleName] = useState("Ordinary");
  const [newScopeType, setNewScopeType] = useState("");
  const [newScopeId, setNewScopeId] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await getUser(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          first_name: 1,
          last_name: 1,
          roles: 1,
          units: { _id: 1, name: 1 },
          organizations: { _id: 1, name: 1 },
        }
      );
      if (result.success && result.body) {
        setRoles(result.body.roles || []);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddRole = async () => {
    const addRoles = [
      {
        name: newRoleName as "Manager" | "Admin" | "OrgHead" | "UnitHead" | "Employee" | "Ordinary",
        ...(newScopeType ? { scopeType: newScopeType as "organization" | "unit" } : {}),
        ...(newScopeId ? { scopeId: newScopeId } : {}),
      },
    ];

    setSubmitting(true);
    const result = await addOrRemoveRoles(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        addRoles,
      },
      { _id: 1, roles: 1 }
    );
    setSubmitting(false);

    if (result.success) {
      toast.success("نقش با موفقیت افزوده شد");
      setRoles(result.body?.roles || roles);
      setNewRoleName("Ordinary");
      setNewScopeType("");
      setNewScopeId("");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در افزودن نقش");
    }
  };

  const handleRemoveRole = async (role: RoleEntry) => {
    setSubmitting(true);
    const result = await addOrRemoveRoles(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        removeRoles: [
          {
            name: role.name as "Manager" | "Admin" | "OrgHead" | "UnitHead" | "Employee" | "Ordinary",
            ...(role.scopeType ? { scopeType: role.scopeType as "organization" | "unit" } : {}),
            ...(role.scopeId ? { scopeId: role.scopeId } : {}),
          },
        ],
      },
      { _id: 1, roles: 1 }
    );
    setSubmitting(false);

    if (result.success) {
      toast.success("نقش با موفقیت حذف شد");
      setRoles(result.body?.roles || roles.filter((r) => r.roleId !== role.roleId));
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف نقش");
    }
  };

  if (loading) return <LoadingSkeleton type="card" count={1} />;

  if (notFound) {
    return (
      <div>
        <ErrorState
          title="کاربر مورد نظر یافت نشد"
          message="کاربری با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 border border-electric-iris/20">
            <Shield className="size-5 text-electric-iris" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              مدیریت نقش‌ها
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              افزودن و حذف نقش‌های دسترسی کاربر. تغییر نقش‌ها به صورت خودکار واحدها و سازمان‌های مرتبط را به‌روز می‌کند.
            </p>
          </div>
        </div>
      </div>

      <FormCard title="نقش‌های فعلی" description="لیست نقش‌های دسترسی این کاربر">
        {roles.length === 0 ? (
          <p className="text-sm text-fog/50 text-center py-6">هیچ نقشی تعریف نشده است</p>
        ) : (
          <div className="space-y-2">
            {roles.map((role, index) => (
              <div
                key={role.roleId || index}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.02] border border-steel-border/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="size-4 text-frost-link shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-moonlight">
                      {roleLabelMap[role.name] || role.name}
                    </span>
                    {role.scopeType && role.scopeId && (
                      <span className="text-xs text-fog/60 block truncate">
                        {role.scopeType === "organization" ? "سازمان" : "واحد"} • {role.scopeId}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-destructive shrink-0"
                  onClick={() => handleRemoveRole(role)}
                  disabled={submitting}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </FormCard>

      <FormCard title="افزودن نقش جدید" description="نقش و محدوده دسترسی را تعیین کنید">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-fog/70 block font-medium">نقش</label>
            <select
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              disabled={submitting}
              className="w-full h-9 rounded-sm bg-white/[0.03] border border-steel-border/60 px-3 text-sm text-moonlight transition-all duration-200 outline-none hover:border-frost-link/20 focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-fog/70 block font-medium">حوزه</label>
            <select
              value={newScopeType}
              onChange={(e) => {
                setNewScopeType(e.target.value);
                if (!e.target.value) setNewScopeId("");
              }}
              disabled={submitting}
              className="w-full h-9 rounded-sm bg-white/[0.03] border border-steel-border/60 px-3 text-sm text-moonlight transition-all duration-200 outline-none hover:border-frost-link/20 focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">بدون محدودیت</option>
              <option value="organization">سازمان</option>
              <option value="unit">واحد</option>
            </select>
          </div>

          {newScopeType && (
            <div className="space-y-1.5">
              <label className="text-xs text-fog/70 block font-medium">
                {newScopeType === "organization" ? "سازمان" : "واحد"}
              </label>
              <SearchSelect
                value={newScopeId}
                onChange={setNewScopeId}
                placeholder={
                  newScopeType === "organization"
                    ? "انتخاب سازمان..."
                    : "انتخاب واحد..."
                }
                fetcher={
                  newScopeType === "organization"
                    ? async (search?: string) => {
                        const result = await getOrganizations(
                          { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                          { _id: 1, name: 1 }
                        );
                        if (!result.success || !result.body) return [];
                        return result.body.map((o: { _id?: string; name?: string }) => ({
                          _id: o._id || "",
                          name: o.name || "",
                        }));
                      }
                    : async (search?: string) => {
                        const result = await getUnits(
                          { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                          { _id: 1, name: 1 }
                        );
                        if (!result.success || !result.body) return [];
                        return result.body.map((u: { _id?: string; name?: string }) => ({
                          _id: u._id || "",
                          name: u.name || "",
                        }));
                      }
                }
                label={newScopeType === "organization" ? "سازمان" : "واحد"}
                disabled={submitting}
              />
            </div>
          )}

          <Button
            type="button"
            onClick={handleAddRole}
            disabled={submitting || !newRoleName}
            className="gap-1.5 w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال افزودن...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                افزودن نقش
              </>
            )}
          </Button>
        </div>
      </FormCard>

      <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        <Link href={`/admin/users/${id}`}>
          <Button type="button" variant="ghost" disabled={submitting}>
            بازگشت
          </Button>
        </Link>
      </div>
    </div>
  );
}
