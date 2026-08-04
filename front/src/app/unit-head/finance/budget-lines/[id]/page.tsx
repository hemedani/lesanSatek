import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Calculator, Lock, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { get as getBudgetLine } from "@/app/actions/budgetLine/get"
import { gets as getBudgetAllocations } from "@/app/actions/budgetAllocation/gets"
import { gets as getBudgetEncumbrances } from "@/app/actions/budgetEncumbrance/gets"
import { DirectDeductionForm } from "./direct-deduction-form"

interface AllocationItem {
  _id: string
  amount?: number
  description?: string
  allocatedAt?: string
  allocatedBy?: { _id?: string; first_name?: string; last_name?: string }
}

interface EncumbranceItem {
  _id: string
  amount?: number
  status?: string
  description?: string
  createdAt?: string
}

export default async function UnitHeadFinanceBudgetLineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [blRes, allocationsRes, encumbrancesRes] = await Promise.all([
    getBudgetLine(
      { _id: id },
      {
        _id: 1, code: 1, title: 1, description: 1,
        totalAllocated: 1, totalEncumbered: 1, totalSpent: 1, remainingBudget: 1,
        fiscalYear: { _id: 1, name: 1 },
        organization: { _id: 1, name: 1 },
      },
    ),
    getBudgetAllocations(
      { page: 1, limit: 50, budgetLineId: id },
      { _id: 1, amount: 1, description: 1, allocatedAt: 1, allocatedBy: { _id: 1, first_name: 1, last_name: 1 } },
    ),
    getBudgetEncumbrances(
      { page: 1, limit: 50, budgetLineId: id },
      { _id: 1, amount: 1, status: 1, description: 1, referenceType: 1, referenceId: 1, createdAt: 1 },
    ),
  ])

  if (!blRes.success || !blRes.body?.[0]) notFound()

  const budgetLine = blRes.body[0]
  const allocations: AllocationItem[] = allocationsRes.success ? allocationsRes.body || [] : []
  const encumbrances: EncumbranceItem[] = encumbrancesRes.success ? encumbrancesRes.body || [] : []

  function remainingColor(remaining?: number, allocated?: number) {
    if (!remaining || !allocated) return "text-fog"
    const ratio = remaining / allocated
    if (ratio <= 0.1) return "text-ember"
    if (ratio <= 0.3) return "text-amber-400"
    return "text-emerald-400"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/unit-head/finance/budget-lines"
          className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
        >
          <ArrowRight className="size-4" />
          بازگشت به ردیف‌های بودجه
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Line Info */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                  <Calculator className="size-5 text-electric-iris" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium text-frost-link">
                    {budgetLine.title || "بدون عنوان"}
                  </CardTitle>
                  {budgetLine.code && (
                    <p className="text-xs text-fog/50 mt-0.5">کد: {budgetLine.code}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {budgetLine.description && (
                <p className="text-sm text-fog/70 mb-4">{budgetLine.description}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-fog">تخصیص کل</p>
                  <p className="text-moonlight font-medium mt-0.5" dir="ltr">
                    {budgetLine.totalAllocated?.toLocaleString("fa-IR") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">تعهد شده</p>
                  <p className="text-moonlight font-medium mt-0.5" dir="ltr">
                    {budgetLine.totalEncumbered?.toLocaleString("fa-IR") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">مصرف شده</p>
                  <p className="text-moonlight font-medium mt-0.5" dir="ltr">
                    {budgetLine.totalSpent?.toLocaleString("fa-IR") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">باقی‌مانده</p>
                  <p className={`font-medium mt-0.5 ${remainingColor(budgetLine.remainingBudget, budgetLine.totalAllocated)}`} dir="ltr">
                    {budgetLine.remainingBudget?.toLocaleString("fa-IR") || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocations */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-inset ring-teal-500/15">
                  <Wallet className="size-4 text-teal-400" />
                </div>
                <CardTitle className="text-sm font-medium text-moonlight">تخصیص‌ها</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {allocations.length === 0 ? (
                <p className="text-sm text-fog/50">هیچ تخصیصی ثبت نشده است.</p>
              ) : (
                <div className="divide-y divide-steel-border/10">
                  {allocations.map((a) => {
                    const allocatedBy = a.allocatedBy
                    return (
                      <div key={String(a._id)} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-moonlight" dir="ltr">
                            {Number(a.amount || 0).toLocaleString("fa-IR")} ریال
                          </p>
                          {a.description && (
                            <p className="text-xs text-fog/50 mt-0.5">{String(a.description)}</p>
                          )}
                        </div>
                        <div className="text-xs text-fog/40 text-end">
                          {a.allocatedAt && (
                            <p>{new Date(String(a.allocatedAt)).toLocaleDateString("fa-IR")}</p>
                          )}
                          {allocatedBy && (
                            <p>{String(allocatedBy.first_name || "")} {String(allocatedBy.last_name || "")}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Encumbrances */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-inset ring-amber-500/15">
                  <Lock className="size-4 text-amber-400" />
                </div>
                <CardTitle className="text-sm font-medium text-moonlight">تعهدات</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {encumbrances.length === 0 ? (
                <p className="text-sm text-fog/50">هیچ تعهدی ثبت نشده است.</p>
              ) : (
                <div className="divide-y divide-steel-border/10">
                  {encumbrances.map((e) => (
                    <div key={String(e._id)} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-moonlight" dir="ltr">
                          {Number(e.amount || 0).toLocaleString("fa-IR")} ریال
                        </p>
                        {e.description && (
                          <p className="text-xs text-fog/50 mt-0.5">{String(e.description)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {e.status && (
                          <Badge className="text-[10px]">{String(e.status)}</Badge>
                        )}
                        {e.createdAt && (
                          <span className="text-xs text-fog/40">{new Date(String(e.createdAt)).toLocaleDateString("fa-IR")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {budgetLine.code && (
                <div>
                  <p className="text-xs text-fog">کد</p>
                  <p className="text-moonlight font-mono">{budgetLine.code}</p>
                </div>
              )}
              {budgetLine.fiscalYear?.name && (
                <div>
                  <p className="text-xs text-fog">سال مالی</p>
                  <p className="text-moonlight">{budgetLine.fiscalYear.name}</p>
                </div>
              )}
              {budgetLine.organization?.name && (
                <div>
                  <p className="text-xs text-fog">سازمان</p>
                  <p className="text-moonlight">{budgetLine.organization.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-fog">باقی‌مانده</p>
                <p className={`font-medium text-lg ${remainingColor(budgetLine.remainingBudget, budgetLine.totalAllocated)}`} dir="ltr">
                  {budgetLine.remainingBudget?.toLocaleString("fa-IR") || "—"} ریال
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Direct Deduction */}
          <DirectDeductionForm budgetLineId={budgetLine._id} remainingBudget={budgetLine.remainingBudget || 0} />
        </div>
      </div>
    </div>
  )
}
