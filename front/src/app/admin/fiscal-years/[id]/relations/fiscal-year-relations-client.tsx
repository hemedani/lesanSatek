"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SearchSelect } from "@/components/form/form-search-select"
import { updateRelations } from "@/app/actions/fiscalYear/updateRelations"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface FiscalYearRelationsProps {
  fiscalYear: {
    _id: string
    name?: string
    organization?: { _id: string; name?: string }
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

export function FiscalYearRelationsClient({ fiscalYear }: FiscalYearRelationsProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [organizationId, setOrganizationId] = useState(fiscalYear.organization?._id || "")
  const originalOrganizationId = fiscalYear.organization?._id || ""

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

  const handleSubmit = async () => {
    if (!organizationId) return
    setSubmitting(true)
    try {
      const result = await updateRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: fiscalYear._id,
          organizationId,
        },
        { _id: 1, name: 1, organization: { _id: 1, name: 1 } },
      )
      if (result.success) {
        toast.success("روابط با موفقیت به‌روزرسانی شد")
        router.push(`/admin/fiscal-years/${fiscalYear._id}`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی روابط")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی روابط")
    } finally {
      setSubmitting(false)
    }
  }

  const organizationChanged = organizationId !== originalOrganizationId

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={fiscalYear.name || "ویرایش روابط"}
        description="ویرایش روابط سال مالی"
      >
        <Link href={`/admin/fiscal-years/${fiscalYear._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
      <HelpLauncher topicId="admin-fiscal-years" tooltip="راهنمای روابط سال مالی" />
      </PageHeader>

      <SectionCard
        icon={Building2}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="سازمان"
        description="سازمانی که سال مالی برای آن تعریف می‌شود"
      >
        <div className="space-y-2.5">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-moonlight">سازمان</p>
            <p className="mt-0.5 text-caption text-fog/60">با تغییر، سازمان فعلی سال مالی جایگزین می‌شود</p>
          </div>
          <SearchSelect
            value={organizationId}
            onChange={setOrganizationId}
            placeholder="انتخاب سازمان…"
            fetcher={organizationFetcher}
            label="سازمان"
            disabled={submitting}
            displayLabel={fiscalYear.organization?.name}
          />
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <p className="hidden text-caption text-fog/60 sm:block">
            تغییرات پس از ذخیره روی سال مالی اعمال می‌شود
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              type="button"
              size="lg"
              disabled={submitting || !organizationId || !organizationChanged}
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
              onClick={() => router.push(`/admin/fiscal-years/${fiscalYear._id}`)}
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
