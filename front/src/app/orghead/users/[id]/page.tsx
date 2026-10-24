"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState, use } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Loader2, Lock, Trash2, UserCog, Shield, ShieldCheck, Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { SectionCard } from "@/components/form/section-card"
import { Form } from "@/components/ui/form"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ErrorState } from "@/components/ui/error-state"
import { FilterSelect } from "@/components/ui/filter-select"
import { SearchSelect } from "@/components/form/form-search-select"
import { getUser } from "@/app/actions/user/getUser"
import { updateUser } from "@/app/actions/user/updateUser"
import { removeUser } from "@/app/actions/user/removeUser"
import { addOrRemoveRoles } from "@/app/actions/user/addOrRemoveRoles"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { useAuthStore } from "@/stores/authStore"
import { resolveActionErrorMessage } from "@/lib/action-errors"
import {
  getAssignableRoleNames,
  getAssignableRoleOptions,
  getAssignableScopeOptions,
  isRoleAssignableBy,
} from "@/types/permissions"
import Link from "next/link"

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  gender: z.enum(["Male", "Female"]),
  isActive: z.boolean(),
  is_verified: z.boolean(),
  position: z.string().optional(),
})

type UserData = z.infer<typeof userSchema>

interface UserRole {
  roleId?: string
  name?: string
  scopeType?: "organization" | "unit" | "store"
  scopeId?: string
}

const ROLE_LABELS: Record<string, string> = {
  Manager: "مدیر سیستم",
  Admin: "ادمین",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "سرپرست فروشگاه",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
}

const SCOPE_LABELS: Record<string, string> = {
  organization: "سازمان",
  unit: "واحد",
  store: "فروشگاه",
}

type RoleName = "Manager" | "Admin" | "OrgHead" | "UnitHead" | "StoreHead" | "Employee" | "Ordinary"
type ScopeType = "organization" | "unit" | "store"

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [userName, setUserName] = useState("ویرایش کاربر")
  const { id } = use(params)

  const [roles, setRoles] = useState<UserRole[]>([])
  const [scopeNameMap, setScopeNameMap] = useState<Record<string, string>>({})

  const [savingRoles, setSavingRoles] = useState(false)
  const [removingRole, setRemovingRole] = useState<UserRole | null>(null)
  const [removalLoading, setRemovalLoading] = useState(false)
  const [newRoleName, setNewRoleName] = useState<RoleName>("Ordinary")
  const [newScopeType, setNewScopeType] = useState<ScopeType | "">("")
  const [newScopeId, setNewScopeId] = useState("")

  const actorUser = useAuthStore((state) => state.user)
  const activeRoleId = useAuthStore((state) => state.activeRoleId)
  const actorRole = actorUser?.roles?.find((role) => role.roleId === activeRoleId)
  const actorRoleName = actorRole?.name
  const activeOrganizationId =
    actorRoleName === "OrgHead"
      ? actorRole?.scopeType === "organization"
        ? actorRole.scopeId || ""
        : actorUser?.organizations?.[0]?._id || ""
      : ""
  const activeOrganizationName =
    actorUser?.organizations?.find((organization) => organization._id === activeOrganizationId)?.name || ""
  const roleOptions = useMemo(() => getAssignableRoleOptions(actorRoleName), [actorRoleName])
  const scopeOptions = useMemo(() => getAssignableScopeOptions(actorRoleName), [actorRoleName])
  const assignableRoleNames = useMemo(() => getAssignableRoleNames(actorRoleName), [actorRoleName])

  const form = useForm<UserData>({
    resolver: zodV4Resolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      mobile: "",
      gender: "Male",
      isActive: true,
      is_verified: false,
      position: "",
    },
  })

  const loadData = useCallback(
    async (initial = false) => {
      const currentRoleId = getActiveRoleIdFromStore()
      const [userResult, orgsResult, unitsResult] = await Promise.all([
        getUser(
          { activeRoleId: currentRoleId, _id: id },
          {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            mobile: 1,
            gender: 1,
            isActive: 1,
            is_verified: 1,
            position: 1,
            roles: 1,
          },
        ),
        getOrganizations({ activeRoleId: currentRoleId, page: 1, limit: 100 }, { _id: 1, name: 1 }),
        getUnits({ activeRoleId: currentRoleId, page: 1, limit: 100 }, { _id: 1, name: 1 }),
      ])
      const map: Record<string, string> = {}
      if (orgsResult.success) orgsResult.body?.forEach((o: { _id?: string; name?: string }) => { if (o?._id) map[o._id] = o.name || "" })
      if (unitsResult.success) unitsResult.body?.forEach((u: { _id?: string; name?: string }) => { if (u?._id) map[u._id] = u.name || "" })
      setScopeNameMap(map)

      if (userResult.success && userResult.body) {
        const user = userResult.body
        setUserName([user.first_name, user.last_name].filter(Boolean).join(" ") || "ویرایش کاربر")
        setRoles(user.roles || [])
        if (initial) {
          form.reset({
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            mobile: user.mobile || "",
            gender: user.gender || "Male",
            isActive: user.isActive ?? true,
            is_verified: user.is_verified ?? false,
            position: user.position || "",
          })
        }
      } else if (initial) {
        setNotFound(true)
      }
      if (initial) setLoading(false)
      return userResult.success && !!userResult.body
    },
    [form, id],
  )

  useEffect(() => {
    void Promise.resolve().then(() => loadData(true))
  }, [loadData])

  const onSubmit = async (data: UserData) => {
    try {
      const result = await updateUser(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: id,
          ...data,
        },
        { _id: 1, first_name: 1 },
      )
      if (result.success) {
        toast.success("کاربر با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(resolveActionErrorMessage(result.body?.message, "خطا در به‌روزرسانی کاربر"))
      }
    } catch {
      toast.error("خطا در به‌روزرسانی کاربر")
    }
  }

  const handleDelete = async () => {
    const result = await removeUser({ activeRoleId: getActiveRoleIdFromStore(), _id: id })
    if (result.success) {
      toast.success("کاربر با موفقیت حذف شد")
      router.push("/orghead/users")
    } else {
      toast.error(resolveActionErrorMessage(result.body?.message, "خطا در حذف کاربر"))
    }
    setShowDelete(false)
  }

  const scopeFetcher = async (search?: string) => {
    if (newScopeType === "organization") {
      const result = await getOrganizations(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
        { _id: 1, name: 1 },
      )
      if (!result.success || !result.body) return []
      return result.body.map((o: { _id?: string; name?: string }) => ({ _id: o._id || "", name: o.name || "" }))
    }
    const result = await getUnits(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((u: { _id?: string; name?: string }) => ({ _id: u._id || "", name: u.name || "" }))
  }

  const handleAddRole = async () => {
    if (!isRoleAssignableBy(actorRoleName, newRoleName)) {
      toast.error("شما مجاز به اختصاص این نقش نیستید.")
      return
    }

    setSavingRoles(true)
    try {
      const scopeId = newScopeType === "organization" ? activeOrganizationId : newScopeId
      const result = await addOrRemoveRoles(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: id,
          addRoles: [
            {
              name: newRoleName,
              ...(newScopeType ? { scopeType: newScopeType as ScopeType } : {}),
              ...(scopeId ? { scopeId } : {}),
            },
          ],
        },
        { _id: 1, roles: 1 },
      )
      if (result.success) {
        toast.success("نقش با موفقیت افزوده شد")
        setRoles(result.body?.roles ?? [])
        setNewRoleName("Ordinary")
        setNewScopeType("")
        setNewScopeId("")
        await loadData()
      } else {
        toast.error(resolveActionErrorMessage(result.body?.message, "خطا در افزودن نقش"))
      }
    } catch {
      toast.error("خطا در افزودن نقش")
    } finally {
      setSavingRoles(false)
    }
  }

  const handleRemoveRoleConfirm = async () => {
    if (!removingRole) return
    if (!isRoleAssignableBy(actorRoleName, removingRole.name)) {
      toast.error("شما مجاز به حذف این نقش نیستید.")
      setRemovingRole(null)
      return
    }

    setRemovalLoading(true)
    try {
      const result = await addOrRemoveRoles(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: id,
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
        setRoles(result.body?.roles ?? [])
        await loadData()
      } else {
        toast.error(resolveActionErrorMessage(result.body?.message, "خطا در حذف نقش"))
      }
    } catch {
      toast.error("خطا در حذف نقش")
    } finally {
      setRemovalLoading(false)
      setRemovingRole(null)
    }
  }

  const addDisabled =
    savingRoles ||
    !newRoleName ||
    !isRoleAssignableBy(actorRoleName, newRoleName) ||
    (newScopeType === "unit" && !newScopeId) ||
    (newScopeType === "organization" && !activeOrganizationId && !newScopeId) ||
    (newScopeType === "store" && !newScopeId)

  if (loading) return <LoadingSkeleton type="card" count={1} />

  if (notFound) {
    return (
      <div>
        <ErrorState title="کاربر مورد نظر یافت نشد" message="کاربری با این شناسه در سامانه وجود ندارد." />
        <div className="flex justify-center mt-4">
          <Link href="/orghead/users">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title={userName} description="ویرایش اطلاعات کاربر">
        <Link href="/orghead/users">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به کاربران
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={() => setShowDelete(true)}
          className="gap-2 px-4 text-ember hover:bg-ember/5 hover:text-ember"
        >
          <Trash2 className="size-5" />
          حذف
        </Button>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={UserCog}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات شخصی"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput control={form.control} name="first_name" label="نام" required disabled={submitting} />
              <FormInput control={form.control} name="last_name" label="نام خانوادگی" required disabled={submitting} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput control={form.control} name="email" label="ایمیل" type="email" required disabled={submitting} />
              <FormInput control={form.control} name="mobile" label="شماره موبایل" required disabled={submitting} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSelect control={form.control} name="gender" label="جنسیت" options={[{ value: "Male", label: "مرد" }, { value: "Female", label: "زن" }]} disabled={submitting} />
              <FormInput control={form.control} name="position" label="سمت" placeholder="مثال: مدیر مالی" disabled={submitting} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormCheckbox control={form.control} name="isActive" label="فعال" disabled={submitting} />
              <FormCheckbox control={form.control} name="is_verified" label="تایید شده" disabled={submitting} />
            </div>
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Check className="size-5" />
                  )}
                  ذخیره تغییرات
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={submitting}
                  onClick={() => router.push("/orghead/users")}
                  className="gap-2 px-5"
                >
                  <X className="size-5" />
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      <SectionCard
        icon={Shield}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title="نقش‌ها و دسترسی‌ها"
        description="نقش‌های کاربر و محدوده هر نقش"
      >
        {roles.length > 0 ? (
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
                      <ShieldCheck className="size-5 text-electric-iris" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-moonlight">{ROLE_LABELS[role.name || ""] || role.name || "کاربر عادی"}</p>
                      {role.scopeType && (
                        <p className="mt-0.5 text-xs text-fog/60">
                          {SCOPE_LABELS[role.scopeType] ?? role.scopeType}
                          {scopeName ? ` · ${scopeName}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  {assignableRoleNames.includes(role.name as RoleName) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemovingRole(role)}
                      disabled={savingRoles}
                      className="shrink-0 gap-1.5 px-3 text-fog/70 hover:text-ember hover:bg-ember/5"
                    >
                      <Trash2 className="size-4" />
                      حذف
                    </Button>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1.5 px-3 text-xs text-fog/50">
                      <Lock className="size-3.5" />
                      غیرقابل تغییر
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-steel-border/30 px-4 py-8 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-inset ring-steel-border/20">
              <Shield className="size-5 text-fog/60" />
            </div>
            <p className="mt-3 text-sm font-medium text-moonlight">هنوز نقشی تعریف نشده است</p>
            <p className="mt-1 text-xs text-fog/60">با افزودن نقش از بخش پایین، دسترسی‌های این کاربر را مشخص کنید.</p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 border-t border-steel-border/15 pt-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <p className="text-body-sm font-medium text-moonlight">نقش</p>
            <FilterSelect
              placeholder="انتخاب نقش…"
              ariaLabel="انتخاب نقش"
              value={newRoleName}
              onValueChange={(v) => {
                if (!v) return
                const roleName = v as RoleName
                setNewRoleName(roleName)
                if (roleName === "OrgHead" && activeOrganizationId) {
                  setNewScopeType("organization")
                  setNewScopeId(activeOrganizationId)
                }
              }}
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
                const scopeType = (v || "") as ScopeType | ""
                setNewScopeType(scopeType)
                setNewScopeId(scopeType === "organization" ? activeOrganizationId : "")
              }}
              options={scopeOptions}
            />
          </div>
        </div>

        {newScopeType && (
          <div className="mt-5 space-y-2.5">
            <p className="text-body-sm font-medium text-moonlight">{SCOPE_LABELS[newScopeType]}</p>
            {newScopeType === "organization" ? (
              <div
                dir="rtl"
                className="flex h-10 items-center rounded-sm border border-steel-border/40 bg-white/[0.02] px-3 text-sm text-moonlight"
              >
                {activeOrganizationName || "سازمان فعال"}
              </div>
            ) : (
              <SearchSelect
                value={newScopeId}
                onChange={setNewScopeId}
                placeholder={`انتخاب ${SCOPE_LABELS[newScopeType]}…`}
                fetcher={scopeFetcher}
                label={SCOPE_LABELS[newScopeType]}
                disabled={savingRoles}
              />
            )}
          </div>
        )}

        <Button type="button" onClick={handleAddRole} disabled={addDisabled} className="gap-2 px-5">
          {savingRoles ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
          افزودن نقش
        </Button>
      </SectionCard>

      <ConfirmDialog
        open={!!removingRole}
        onOpenChange={(open) => { if (!open) setRemovingRole(null) }}
        title="حذف نقش"
        description={`آیا از حذف نقش «${ROLE_LABELS[removingRole?.name || ""] || removingRole?.name || ""}» از این کاربر اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleRemoveRoleConfirm}
        loading={removalLoading}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف کاربر"
        description="آیا از حذف این کاربر اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  )
}