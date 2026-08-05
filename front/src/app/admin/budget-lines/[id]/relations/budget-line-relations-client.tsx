"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, Landmark, Building2, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SearchSelect } from "@/components/form/form-search-select"
import { updateRelations } from "@/app/actions/budgetLine/updateRelations"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

function nameOf(value?: { _id?: string; name?: string }): string {
  return value?.name || ""
}

interface BudgetLineRelationsProps {
  budgetLine: {
    _id: string
    code?: string
    title?: string
    fiscalYear?: { _id: string; name?: string }
    organization?: { _id: string; name?: string }
    unit?: { _id: string; name?: string }
    wareType?: { _id: string; name?: string }
  }
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
            className={
              iconClassName ||
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-fog ring-1 ring-inset ring-steel-border/20"
            }
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

export function BudgetLineRelationsClient({ budgetLine }: BudgetLineRelationsProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [fiscalYearId, setFiscalYearId] = useState(budgetLine.fiscalYear?._id || "")
  const [organizationId, setOrganizationId] = useState(budgetLine.organization?._id || "")
  const [unitId, setUnitId] = useState(budgetLine.unit?._id || "")
  const [wareTypeId, setWareTypeId] = useState(budgetLine.wareType?._id || "")
  const originalFiscalYearId = budgetLine.fiscalYear?._id || ""
  const originalOrganizationId = budgetLine.organization?._id || ""
  const originalUnitId = budgetLine.unit?._id || ""
  const originalWareTypeId = budgetLine.wareType?._id || ""

  const fiscalYearFetcher = async (q?: string) => {
    const result = await getFiscalYears(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, sortBy: "name", sortOrder: "asc", ...(q ? { name: q } : {}) },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((f: { _id?: string; name?: string }) => ({
      _id: f._id || "",
      name: f.name || "",
    }))
  }

  const organizationFetcher = async (q?: string) => {
    const result = await getOrganizations(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((o: { _id?: string; name?: string }) => ({
      _id: o._id || "",
      name: o.name || "",
    }))
  }

  const unitFetcher = async (q?: string) => {
    const result = await getUnits(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((u: { _id?: string; name?: string }) => ({
      _id: u._id || "",
      name: u.name || "",
    }))
  }

  const wareTypeFetcher = async (q?: string) => {
    const result = await getWareTypes(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((w: { _id?: string; name?: string }) => ({
      _id: w._id || "",
      name: w.name || "",
    }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: budgetLine._id,
          ...(fiscalYearId && fiscalYearId !== originalFiscalYearId ? { fiscalYearId } : {}),
          ...(organizationId && organizationId !== originalOrganizationId ? { organizationId } : {}),
          ...(unitId && unitId !== originalUnitId ? { unitId } : {}),
          ...(wareTypeId && wareTypeId !== originalWareTypeId ? { wareTypeId } : {}),
        },
        {
          _id: 1,
          code: 1,
          title: 1,
          fiscalYear: { _id: 1, name: 1 },
          organization: { _id: 1, name: 1 },
          unit: { _id: 1, name: 1 },
          wareType: { _id: 1, name: 1 },
        },
      )
      if (result.success) {
        toast.success("روابط با موفقیت به‌روزرسانی شد")
        router.push(`/admin/budget-lines/${budgetLine._id}`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی روابط")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی روابط")
    } finally {
      setSubmitting(false)
    }
  }

  const anythingChanged =
    fiscalYearId !== originalFiscalYearId ||
    organizationId !== originalOrganizationId ||
    unitId !== originalUnitId ||
    wareTypeId !== originalWareTypeId

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={budgetLine.title || budgetLine.code || "ویرایش روابط"}
        description="ویرایش روابط ردیف بودجه"
      >
        <Link href={`/admin/budget-lines/${budgetLine._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
      <HelpLauncher topicId="admin-budget-lines" tooltip="راهنمای روابط ردیف بودجه" />
      </PageHeader>

      <SectionCard
        icon={Landmark}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="سال مالی"
        description="سال مالی ردیف بودجه را تغییر دهید"
      >
        <div className="space-y-2.5">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-moonlight">سال مالی</p>
            <p className="mt-0.5 text-caption text-fog/60">با تغییر، سال مالی فعلی ردیف جایگزین می‌شود</p>
          </div>
          <SearchSelect
            value={fiscalYearId}
            onChange={setFiscalYearId}
            placeholder="انتخاب سال مالی…"
            fetcher={fiscalYearFetcher}
            label="سال مالی"
            disabled={submitting}
            displayLabel={nameOf(budgetLine.fiscalYear)}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Building2}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="سازمان"
        description="سازمانی که ردیف بودجه برای آن تعریف می‌شود"
      >
        <div className="space-y-2.5">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-moonlight">سازمان</p>
            <p className="mt-0.5 text-caption text-fog/60">با تغییر، سازمان فعلی ردیف جایگزین می‌شود</p>
          </div>
          <SearchSelect
            value={organizationId}
            onChange={setOrganizationId}
            placeholder="انتخاب سازمان…"
            fetcher={organizationFetcher}
            label="سازمان"
            disabled={submitting}
            displayLabel={nameOf(budgetLine.organization)}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Tags}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title="دامنه اختیاری"
        description="واحد و نوع کالای مرتبط با ردیف بودجه"
      >
        <div className="space-y-6">
          <div className="space-y-2.5">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-moonlight">واحد</p>
              <p className="mt-0.5 text-caption text-fog/60">در صورت نیاز، ردیف بودجه به این واحد محدود می‌شود</p>
            </div>
            <SearchSelect
              value={unitId}
              onChange={setUnitId}
              placeholder="انتخاب واحد…"
              fetcher={unitFetcher}
              label="واحد"
              disabled={submitting}
              displayLabel={nameOf(budgetLine.unit)}
            />
          </div>
          <div className="space-y-2.5">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-moonlight">نوع کالا</p>
              <p className="mt-0.5 text-caption text-fog/60">در صورت نیاز، ردیف بودجه به این نوع کالا محدود می‌شود</p>
            </div>
            <SearchSelect
              value={wareTypeId}
              onChange={setWareTypeId}
              placeholder="انتخاب نوع کالا…"
              fetcher={wareTypeFetcher}
              label="نوع کالا"
              disabled={submitting}
              displayLabel={nameOf(budgetLine.wareType)}
            />
          </div>
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <p className="hidden text-caption text-fog/60 sm:block">
            تغییرات پس از ذخیره روی ردیف بودجه اعمال می‌شود
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              type="button"
              size="lg"
              disabled={submitting || !fiscalYearId || !organizationId || !anythingChanged}
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
              onClick={() => router.push(`/admin/budget-lines/${budgetLine._id}`)}
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
