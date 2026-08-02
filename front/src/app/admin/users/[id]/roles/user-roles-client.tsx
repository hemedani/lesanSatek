"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Shield, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { SearchSelect } from "@/components/form/form-search-select"
import { FilterSelect } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { FilterOption } from "@/components/ui/filter-select"
import { addOrRemoveRoles } from "@/app/actions/user/addOrRemoveRoles"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface UserRole {
  roleId?: string
  name?: string
  scopeType?: "organization" | "unit" | "store"
  scopeId?: string
}

export interface UserRolesData {
  _id: string
  first_name?: string
  last_name?: string
  roles?: UserRole[]
}

export type ScopeNameMap = Record<string, string>

type RoleName = "Manager" | "Admin" | "OrgHead" | "UnitHead" | "StoreHead" | "Employee" | "Ordinary"
type ScopeType = "organization" | "unit"

const roleOptions: FilterOption[] = [
  { value: "Manager", label: "مدیر سیستم" },
  { value: "Admin", label: "ادمین" },
  { value: "OrgHead", label: "رئیس سازمان" },
  { value: "UnitHead", label: "رئیس واحد" },
  { value: "StoreHead", label: "رئیس فروشگاه" },
  { value: "Employee", label: "کارمند" },
  { value: "Ordinary", label: "کاربر عادی" },
]

const ROLE_LABELS: Record<string, string> = {
  Manager: "مدیر سیستم",
  Admin: "ادمین",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس فروشگاه",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
}

const SCOPE_LABELS: Record<string, string> = {
  organization: "سازمان",
  unit: "واحد",
}

const scopeOptions: FilterOption[] = [
  { value: "", label: "بدون محدودیت" },
  { value: "organization", label: "سازمان" },
  { value: "unit", label: "واحد" },
]

function roleLabel(name?: string): string {
  return name ? ROLE_LABELS[name] ?? name : "کاربر عادی"
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card variant="glass" className="[--card-spacing:--spacing(6)]">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
            {description && <p className="mt-1 text-caption text-fog/70">{description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

interface UserRolesClientProps {
  user: UserRolesData
  scopeNameMap: ScopeNameMap
}

export function UserRolesClient({ user, scopeNameMap }: UserRolesClientProps) {
  const router = useRouter()
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "کاربر"

  const [roles, setRoles] = useState<UserRole[]>(user.roles || [])
  const [submitting, setSubmitting] = useState(false)
  const [removingRole, setRemovingRole] = useState<UserRole | null>(null)
  const [removing, setRemoving] = useState(false)

  const [newRoleName, setNewRoleName] = useState<RoleName>("Ordinary")
  const [newScopeType, setNewScopeType] = useState<ScopeType | "">("")
  const [newScopeId, setNewScopeId] = useState("")

  const handleAddRole = async () => {
    setSubmitting(true)
    try {
      const result = await addOrRemoveRoles(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: user._id,
          addRoles: [
            {
              name: newRoleName,
              ...(newScopeType ? { scopeType: newScopeType as ScopeType } : {}),
              ...(newScopeId ? { scopeId: newScopeId } : {}),
            },
          ],
        },
        { _id: 1, roles: 1 },
      )
      if (result.success) {
        toast.success("نقش با موفقیت افزوده شد")
        setRoles(result.body?.roles || roles)
        setNewRoleName("Ordinary")
        setNewScopeType("")
        setNewScopeId("")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در افزودن نقش")
      }
    } catch {
      toast.error("خطا در افزودن نقش")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveRoleConfirm = async () => {
    if (!removingRole) return
    setRemoving(true)
    try {
      const result = await addOrRemoveRoles(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: user._id,
          removeRoles: [
            {
              name: removingRole.name as RoleName,
              ...(removingRole.scopeType ? { scopeType: removingRole.scopeType as ScopeType } : {}),
              ...(removingRole.scopeId ? { scopeId: removingRole.scopeId } : {}),
            },
          ],
        },
        { _id: 1, roles: 1 },
      )
      if (result.success) {
        toast.success("نقش با موفقیت حذف شد")
        setRoles(result.body?.roles || roles.filter((r) => r.roleId !== removingRole.roleId))
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف نقش")
      }
    } catch {
      toast.error("خطا در حذف نقش")
    } finally {
      setRemoving(false)
      setRemovingRole(null)
    }
  }

  const scopeFetcher = async (search?: string) => {
    if (newScopeType === "organization") {
      const result = await getOrganizations(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
        { _id: 1, name: 1 },
      )
      if (!result.success || !result.body) return []
      return result.body.map((o: { _id?: string; name?: string }) => ({
        _id: o._id || "",
        name: o.name || "",
      }))
    }
    const result = await getUnits(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((u: { _id?: string; name?: string }) => ({
      _id: u._id || "",
      name: u.name || "",
    }))
  }

  const addDisabled = submitting || !newRoleName || (newScopeType === "unit" && !newScopeId) || (newScopeType === "organization" && !newScopeId)

  const removeRoleLabel = removingRole ? roleLabel(removingRole.name) : ""
  const removeRoleScope =
    removingRole?.scopeType && removingRole.scopeId
      ? `${SCOPE_LABELS[removingRole.scopeType] ?? removingRole.scopeType} · ${scopeNameMap[removingRole.scopeId] ?? ""}`
      : ""

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={fullName}
        description="مدیریت نقش‌ها"
      >
        <Link href={`/admin/users/${user._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
      </PageHeader>

      <SectionCard
        icon={Shield}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="نقش‌های فعلی"
        description="نقش‌های دسترسی این کاربر و محدوده هر نقش"
      >
        {roles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-steel-border/30 px-4 py-8 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-inset ring-steel-border/20">
              <Shield className="size-5 text-fog/60" />
            </div>
            <p className="mt-3 text-body-sm font-medium text-moonlight">هنوز نقشی تعریف نشده است</p>
            <p className="mt-1 text-caption text-fog/60">
              با افزودن نقش از بخش پایین، دسترسی‌های این کاربر را مشخص کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {roles.map((role, i) => {
              const scopeName = role.scopeId ? scopeNameMap[role.scopeId] : undefined
              return (
                <div
                  key={role.roleId || i}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.02] p-3.5 ring-1 ring-inset ring-steel-border/20"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                      <Shield className="size-5 text-electric-iris" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-moonlight">{roleLabel(role.name)}</p>
                      {role.scopeType && (
                        <p className="mt-0.5 text-caption text-fog/60">
                          {SCOPE_LABELS[role.scopeType] ?? role.scopeType}
                          {scopeName ? ` · ${scopeName}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemovingRole(role)}
                    disabled={submitting}
                    className="shrink-0 gap-1.5 px-3 text-fog/70 hover:text-ember hover:bg-ember/5"
                  >
                    <Trash2 className="size-4" />
                    حذف
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={Plus}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="افزودن نقش"
        description="نقش و محدوده دسترسی جدید را تعیین کنید"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <p className="text-body-sm font-medium text-moonlight">نقش</p>
            <FilterSelect
              placeholder="انتخاب نقش…"
              ariaLabel="انتخاب نقش"
              value={newRoleName}
              onValueChange={(v) => v && setNewRoleName(v as RoleName)}
              options={roleOptions}
            />
          </div>
          <div className="space-y-2.5">
            <p className="text-body-sm font-medium text-moonlight">حوزه دسترسی</p>
            <FilterSelect
              placeholder="انتخاب حوزه…"
              ariaLabel="انتخاب حوزه دسترسی"
              value={newScopeType}
              onValueChange={(v) => {
                setNewScopeType((v || "") as ScopeType | "")
                if (!v) setNewScopeId("")
              }}
              options={scopeOptions}
            />
          </div>
        </div>

        {newScopeType && (
          <div className="space-y-2.5">
            <p className="text-body-sm font-medium text-moonlight">{SCOPE_LABELS[newScopeType]}</p>
            <SearchSelect
              value={newScopeId}
              onChange={setNewScopeId}
              placeholder={`انتخاب ${SCOPE_LABELS[newScopeType]}…`}
              fetcher={scopeFetcher}
              label={SCOPE_LABELS[newScopeType]}
              disabled={submitting}
            />
          </div>
        )}

        <Button
          type="button"
          onClick={handleAddRole}
          disabled={addDisabled}
          className="gap-2 px-5"
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Plus className="size-5" />
          )}
          افزودن نقش
        </Button>
      </SectionCard>

      <ConfirmDialog
        open={removingRole !== null}
        onOpenChange={(open) => {
          if (!open) setRemovingRole(null)
        }}
        title="حذف نقش"
        description={`آیا از حذف نقش «${removeRoleLabel}»${removeRoleScope ? ` (${removeRoleScope})` : ""} از این کاربر اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleRemoveRoleConfirm}
        loading={removing}
      />
    </div>
  )
}
