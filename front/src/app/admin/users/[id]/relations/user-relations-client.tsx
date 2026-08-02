"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, Building2, GitBranch, MapPin, Shield, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { SearchSelect } from "@/components/form/form-search-select"
import { SearchMultiSelect } from "@/components/form/form-search-multi-select"
import { updateUserRelations } from "@/app/actions/user/updateUserRelations"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { gets as getStates } from "@/app/actions/state/gets"
import { gets as getCities } from "@/app/actions/city/gets"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface UserRelationsData {
  _id: string
  first_name?: string
  last_name?: string
  organizations?: { _id: string; name?: string }[]
  units?: { _id: string; name?: string }[]
  state?: { _id: string; name?: string }
  city?: { _id: string; name?: string }
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

interface UserRelationsClientProps {
  user: UserRelationsData
}

export function UserRelationsClient({ user }: UserRelationsClientProps) {
  const router = useRouter()
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "کاربر"

  const [submitting, setSubmitting] = useState(false)

  const [organizationIds, setOrganizationIds] = useState<string[]>(
    (user.organizations || []).map((o) => o._id),
  )
  const [unitIds, setUnitIds] = useState<string[]>(
    (user.units || []).map((u) => u._id),
  )
  const [stateId, setStateId] = useState(user.state?._id || "")
  const [cityId, setCityId] = useState(user.city?._id || "")

  const orgNameMap: Record<string, string> = {}
  for (const o of user.organizations || []) {
    if (o._id && o.name) orgNameMap[o._id] = o.name
  }

  const unitNameMap: Record<string, string> = {}
  for (const u of user.units || []) {
    if (u._id && u.name) unitNameMap[u._id] = u.name
  }

  const orgFetcher = async (search?: string) => {
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

  const unitFetcher = async (search?: string) => {
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

  const stateFetcher = async (search?: string) => {
    const result = await getStates(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((s: { _id?: string; name?: string }) => ({
      _id: s._id || "",
      name: s.name || "",
    }))
  }

  const cityFetcher = async (search?: string) => {
    const result = await getCities(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        page: 1,
        limit: 50,
        search: search || undefined,
        ...(stateId ? { stateId } : {}),
      } as unknown as ReqType["main"]["city"]["gets"]["set"],
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((c: { _id?: string; name?: string }) => ({
      _id: c._id || "",
      name: c.name || "",
    }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateUserRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: user._id,
          organizations: organizationIds,
          ...(unitIds.length ? { units: unitIds } : {}),
          ...(stateId ? { state: stateId } : {}),
          ...(cityId ? { city: cityId } : {}),
        },
        { _id: 1, first_name: 1 },
      )
      if (result.success) {
        toast.success("روابط با موفقیت به‌روزرسانی شد")
        router.push(`/admin/users/${user._id}`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی روابط")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی روابط")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={fullName}
        description="ویرایش روابط"
      >
        <Link href={`/admin/users/${user._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
        <Link href={`/admin/users/${user._id}/roles`}>
          <Button variant="ghost" className="gap-2 px-4">
            <Shield className="size-5" />
            مدیریت نقش‌ها
          </Button>
        </Link>
      </PageHeader>

      <SectionCard
        icon={Building2}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="سازمان‌ها"
        description="سازمان‌هایی که این کاربر عضو آن است"
      >
        <div className="space-y-2.5">
          <p className="text-body-sm font-medium text-moonlight">سازمان‌ها</p>
          <SearchMultiSelect
            value={organizationIds}
            onChange={setOrganizationIds}
            placeholder="انتخاب سازمان‌ها…"
            fetcher={orgFetcher}
            label="سازمان‌ها"
            nameMap={orgNameMap}
            disabled={submitting}
          />
          {organizationIds.length === 0 && (
            <p className="text-caption text-fog/60">هنوز سازمانی برای این کاربر انتخاب نشده است.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        icon={GitBranch}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="واحدها"
        description="واحدهایی که این کاربر به آن‌ها دسترسی دارد"
      >
        <div className="space-y-2.5">
          <p className="text-body-sm font-medium text-moonlight">واحدها</p>
          <SearchMultiSelect
            value={unitIds}
            onChange={setUnitIds}
            placeholder="انتخاب واحدها…"
            fetcher={unitFetcher}
            label="واحدها"
            nameMap={unitNameMap}
            disabled={submitting}
          />
          {unitIds.length === 0 && (
            <p className="text-caption text-fog/60">هنوز واحدی برای این کاربر انتخاب نشده است.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        icon={MapPin}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="موقعیت مکانی"
        description="استان و شهر مرتبط با کاربر"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <p className="text-body-sm font-medium text-moonlight">استان</p>
            <SearchSelect
              value={stateId}
              onChange={(v) => {
                setStateId(v)
                if (v) setCityId("")
              }}
              placeholder="انتخاب استان…"
              fetcher={stateFetcher}
              label="استان"
              displayLabel={user.state?.name}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2.5">
            <p className="text-body-sm font-medium text-moonlight">شهر</p>
            <SearchSelect
              value={cityId}
              onChange={setCityId}
              placeholder="انتخاب شهر…"
              fetcher={cityFetcher}
              label="شهر"
              displayLabel={user.city?.name}
              disabled={submitting}
            />
          </div>
        </div>
        {!stateId && !cityId && (
          <p className="text-caption text-fog/60">هنوز استانی برای این کاربر انتخاب نشده است.</p>
        )}
      </SectionCard>

      <div className="flex items-start gap-2.5 rounded-xl border border-frost-link/15 bg-frost-link/5 px-4 py-3 text-body-sm text-fog">
        <Info className="mt-0.5 size-5 shrink-0 text-frost-link" />
        <p>نقش‌ها و محدوده دسترسی در صفحه اختصاصی «مدیریت نقش‌ها» قابل تنظیم هستند.</p>
      </div>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <p className="hidden text-caption text-fog/60 sm:block">
            تغییرات روابط پس از ذخیره اعمال می‌شود
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              type="button"
              size="lg"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 gap-2 px-5 sm:flex-none"
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Check className="size-5" />
              )}
              ذخیره روابط
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={submitting}
              onClick={() => router.push(`/admin/users/${user._id}`)}
              className="gap-2 px-5"
            >
              <X className="size-5" />
              انصراف
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
