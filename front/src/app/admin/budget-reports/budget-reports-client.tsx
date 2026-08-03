"use client"

import * as React from "react"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Landmark, Building2, FileSpreadsheet, ChartNoAxesColumnIncreasing, Wallet, TrendingDown, TrendingUp, Lock, Calculator, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { FilterSelect } from "@/components/ui/filter-select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/ui/status-badge"
import type { FilterOption } from "@/components/ui/filter-select"
import { cn } from "@/lib/utils"

export interface BudgetReportLine {
  _id: string
  code?: string
  title?: string
  totalAllocated?: number
  totalEncumbered?: number
  totalSpent?: number
  remainingBudget?: number
  allocatePct?: number
  encumberPct?: number
  spentPct?: number
  status?: string
  surplus?: number
  deficit?: number
  utilizationPct?: number
}

export interface YearEndSummary {
  totalAllocated: number
  totalSpent: number
  totalSurplus: number
  totalDeficit: number
  totalRemaining: number
  lineCount: number
}

interface BudgetReportsClientProps {
  fiscalYears: { _id: string; name?: string }[]
  organizations: { _id: string; name?: string }[]
  fiscalYearId: string
  organizationId: string
  fiscalYearName: string
  budgetLines: BudgetReportLine[]
  yearEnd: { lines: BudgetReportLine[]; summary: YearEndSummary } | null
}

function faMoney(value?: number): string {
  if (value == null) return "۰"
  return value.toLocaleString("fa-IR")
}

function pct(value?: number): string {
  if (value == null) return "۰٪"
  return `${value.toLocaleString("fa-IR")}٪`
}

const statusMap: Record<string, string> = {
  under_budget: "زیر بودجه",
  fully_utilized: "تکمیل مصرف",
  over_budget: "مازاد بودجه",
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/[0.06]", color)}>
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-fog/60">{label}</p>
          <p className="mt-1 truncate font-mono text-lg font-semibold text-moonlight leading-7" dir="ltr">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

export function BudgetReportsClient({
  fiscalYears,
  organizations,
  fiscalYearId,
  organizationId,
  fiscalYearName,
  budgetLines,
  yearEnd,
}: BudgetReportsClientProps) {
  const router = useRouter()
  const noSelection = !fiscalYearId

  const fiscalYearOptions: FilterOption[] = fiscalYears.map((fy) => ({ value: fy._id, label: fy.name || fy._id }))
  const organizationOptions: FilterOption[] = organizations.map((o) => ({ value: o._id, label: o.name || o._id }))

  const makeParams = useCallback(
    (next: { fiscalYearId?: string; organizationId?: string }) => {
      const params = new URLSearchParams()
      const nextFY = next.fiscalYearId ?? fiscalYearId
      const nextOrg = next.organizationId ?? organizationId
      if (nextFY) params.set("fiscalYearId", nextFY)
      if (nextOrg) params.set("organizationId", nextOrg)
      return params.toString()
    },
    [fiscalYearId, organizationId],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/admin/budget-reports${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleFiscalYear = (value: string | null) => go(makeParams({ fiscalYearId: value ?? "" }))
  const handleOrganization = (value: string | null) => go(makeParams({ organizationId: value ?? "" }))

  const totalAllocated = budgetLines.reduce((s, l) => s + (l.totalAllocated || 0), 0)
  const totalEncumbered = budgetLines.reduce((s, l) => s + (l.totalEncumbered || 0), 0)
  const totalSpent = budgetLines.reduce((s, l) => s + (l.totalSpent || 0), 0)
  const totalRemaining = budgetLines.reduce((s, l) => s + (l.remainingBudget || 0), 0)
  const utilizationPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارش بودجه"
        description="گزارش عملکرد ردیف‌های بودجه سازمان با انتخاب سال مالی"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {fiscalYearName || "انتخاب نشده"}
        </span>
      </PageHeader>

      <div className="flex flex-wrap items-stretch gap-2.5">
        <FilterSelect
          icon={Landmark}
          placeholder="سال مالی (الزامی)"
          ariaLabel="انتخاب سال مالی برای گزارش"
          value={fiscalYearId}
          onValueChange={handleFiscalYear}
          options={fiscalYearOptions}
        />
        <FilterSelect
          icon={Building2}
          placeholder="سازمان (همه)"
          ariaLabel="فیلتر بر اساس سازمان"
          value={organizationId}
          onValueChange={handleOrganization}
          options={organizationOptions}
        />
      </div>

      {noSelection ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-inset ring-steel-border/15">
            <Landmark className="size-6 text-fog/30" />
          </div>
          <p className="text-sm font-medium text-fog/50">برای مشاهده گزارش، ابتدا یک سال مالی انتخاب کنید</p>
          <p className="mt-1 text-xs text-fog/30">گزارش بودجه و گزارش پایان سال بر اساس سال مالی انتخابی نمایش داده می‌شود.</p>
        </div>
      ) : (
        <Tabs defaultValue="budget" className="w-full" dir="rtl">
          <TabsList>
            <TabsTrigger value="budget">
              <ChartNoAxesColumnIncreasing className="size-4" />
              گزارش بودجه
            </TabsTrigger>
            <TabsTrigger value="year-end">
              <Wallet className="size-4" />
              گزارش پایان سال
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={Landmark} label="کل تخصیص" value={faMoney(totalAllocated)} color="bg-electric-iris/10 text-electric-iris ring-electric-iris/15" />
              <SummaryCard icon={Lock} label="کل تعهد" value={faMoney(totalEncumbered)} color="bg-amber-500/10 text-amber-400 ring-amber-500/15" />
              <SummaryCard icon={TrendingDown} label="کل مصرف" value={faMoney(totalSpent)} color="bg-rose-500/10 text-rose-400 ring-rose-500/15" />
              <SummaryCard icon={Calculator} label="باقی‌مانده" value={faMoney(totalRemaining)} color="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15" />
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-electric-iris" />
                <h3 className="text-body font-semibold text-moonlight">ردیف‌های بودجه</h3>
                <span className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-caption text-fog" dir="ltr">
                  {pct(utilizationPct)} مصرف
                </span>
              </div>
              {budgetLines.length === 0 ? (
                <p className="py-8 text-center text-body-sm text-fog/50">برای این سال مالی ردیف بودجه‌ای یافت نشد.</p>
              ) : (
                <div className="space-y-1.5">
                  <div className="hidden items-center gap-3 border-b border-steel-border/15 px-2 pb-2 text-[11px] font-medium text-fog/50 sm:flex">
                    <span className="w-full min-w-0 flex-1">ردیف بودجه</span>
                    <span className="w-20 shrink-0 text-end" dir="rtl">تخصیص</span>
                    <span className="w-20 shrink-0 text-end" dir="rtl">مصرف</span>
                    <span className="w-24 shrink-0 text-end" dir="rtl">باقی‌مانده</span>
                  </div>
                  {budgetLines.map((bl) => (
                    <div
                      key={bl._id}
                      className="flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.04] sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-body-sm font-medium text-moonlight">{bl.title || "—"}</p>
                          <p className="font-mono text-[11px] text-fog/50" dir="ltr">{bl.code || "—"}</p>
                        </div>
                      </div>
                      <StatusBadge status={bl.status || ""} label={statusMap[bl.status || ""] || "—"} size="sm" />
                      <div className="grid shrink-0 grid-cols-3 gap-4 font-mono text-xs text-right sm:w-[22rem] sm:text-body-sm" dir="ltr">
                        <span className="text-frost-link">{faMoney(bl.totalAllocated)}</span>
                        <span className="text-rose-400">{faMoney(bl.totalSpent)}</span>
                        <span className={cn((bl.remainingBudget ?? 0) < 0 ? "text-rose-400" : "text-emerald-400")}>
                          {faMoney(bl.remainingBudget)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="year-end" className="pt-5">
            {!yearEnd ? (
              <p className="glass-card rounded-xl p-12 text-center text-body text-fog/50">گزارش پایان سال در دسترس نیست.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard icon={Landmark} label="کل تخصیص" value={faMoney(yearEnd.summary.totalAllocated)} color="bg-electric-iris/10 text-electric-iris ring-electric-iris/15" />
                  <SummaryCard icon={TrendingUp} label="کل مصرف" value={faMoney(yearEnd.summary.totalSpent)} color="bg-rose-500/10 text-rose-400 ring-rose-500/15" />
                  <SummaryCard icon={Wallet} label="مازاد" value={faMoney(yearEnd.summary.totalSurplus)} color="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15" />
                  <SummaryCard icon={AlertTriangle} label="کسر" value={faMoney(yearEnd.summary.totalDeficit)} color="bg-ember/10 text-ember ring-ember/15" />
                </div>

                <div className="glass-card rounded-2xl p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Wallet className="size-5 text-electric-iris" />
                    <h3 className="text-body font-semibold text-moonlight">ردیف‌های بودجه</h3>
                    <span className="ms-auto text-caption text-fog/60">{yearEnd.summary.lineCount.toLocaleString("fa-IR")} ردیف</span>
                  </div>
                  {yearEnd.lines.length === 0 ? (
                    <p className="py-8 text-center text-body-sm text-fog/50">ردیف بودجه‌ای یافت نشد.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="hidden items-center gap-3 border-b border-steel-border/15 px-2 pb-2 text-[11px] font-medium text-fog/50 sm:flex">
                        <span className="w-full min-w-0 flex-1">ردیف بودجه</span>
                        <span className="w-20 shrink-0 text-end" dir="rtl">تخصیص</span>
                        <span className="w-24 shrink-0 text-end" dir="rtl">باقی‌مانده</span>
                        <span className="w-20 shrink-0 text-end" dir="rtl">نرخ مصرف</span>
                      </div>
                      {yearEnd.lines.map((bl) => (
                        <div
                          key={bl._id}
                          className="flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.04] sm:flex-row sm:items-center sm:gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body font-medium text-moonlight">{bl.title || "—"}</p>
                            <p className="font-mono text-[11px] text-fog/50" dir="ltr">{bl.code || "—"}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-5 font-mono text-sm" dir="ltr">
                            <span className="w-20 text-end text-frost-link">{faMoney(bl.totalAllocated)}</span>
                            <span className={cn("w-24 text-end", (bl.remainingBudget ?? 0) < 0 ? "text-ember" : "text-emerald-400")}>
                              {faMoney(bl.remainingBudget)}
                            </span>
                            <span className="w-20 text-end text-fog">{pct(bl.utilizationPct)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}