import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ShoppingCart, Building2, Landmark, Store, Package, ClipboardList, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { get as getPR } from "@/app/actions/purchasingRequest/get"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { WorkflowVisualizer } from "@/components/purchasing/workflow-visualizer"
import { HistoryTimeline } from "@/components/purchasing/history-timeline"
import { StepApprovalPanel } from "@/components/purchasing/step-approval-panel"
import { UnitHeadActions } from "./unit-head-actions"
import { ActiveTenderCard } from "@/components/purchasing/active-tender-card"
import { TendersList } from "@/components/purchasing/tenders-list"
import { cookies } from "next/headers"
import { getMe } from "@/app/actions/user/getMe"

type StepApprovalInline = {
  _id: string
  status?: string
  comment?: string
  decidedAt?: string
  decidedBy?: { _id?: string; first_name?: string; last_name?: string; position?: string; roles?: { name?: string }[] }
  unit?: {
    _id: string
    name?: string
    head?: { _id?: string; first_name?: string; last_name?: string; position?: string; roles?: { name?: string }[] }
  }
}

type StepWithApprovals = {
  _id: string
  name?: string
  order?: number
  description?: string
  stepType?: string
  required?: boolean
  groupsOperator?: string
  assigneeGroups?: { operator?: string; unitIds?: string[] }[]
  approvals?: StepApprovalInline[]
}

const statusMap: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
}

export default async function UnitHeadRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const prRes = await getPR(
    { _id: id },
    {
      _id: 1,
      title: 1,
      description: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      updatedAt: 1,
      selectionType: 1,
      selectedTenderOfferId: 1,
      stuff: { _id: 1, quantity: 1, price: 1 },
      stuffStatus: 1,
      estimatedAmount: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      process: {
        _id: 1,
        name: 1,
        description: 1,
        steps: {
          _id: 1,
          name: 1,
          order: 1,
          description: 1,
          stepType: 1,
          required: 1,
          groupsOperator: 1,
          assigneeGroups: 1,
          approvals: {
            _id: 1,
            status: 1,
            comment: 1,
            decidedAt: 1,
            decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: 1 },
            unit: {
              _id: 1,
              name: 1,
              head: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: 1 },
            },
          },
        },
      },
      wareModel: { _id: 1, name: 1 },
      requestingUnit: { _id: 1, name: 1 },
      budgetLine: { _id: 1, code: 1, title: 1, totalAllocated: 1, totalEncumbered: 1 },
      store: { _id: 1, name: 1, address: 1 },
      history: 1,
      stepApprovals: {
        _id: 1,
        status: 1,
        comment: 1,
        decidedAt: 1,
        processStep: { _id: 1, name: 1 },
        unit: { _id: 1, name: 1 },
        decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: 1 },
      },
      goodsReceipts: { _id: 1, receiptNumber: 1, items: 1, receivedAt: 1, status: 1, notes: 1 },
      paymentOrders: { _id: 1, title: 1, amount: 1, status: 1, paidAt: 1 },
      tenders: {
        _id: 1,
        title: 1,
        status: 1,
        deadline: 1,
        offers: { _id: 1, price: 1, deliveryTime: 1, paymentTerms: 1, status: 1, store: { _id: 1, name: 1 } },
      },
    } as any,
  )

  /*
  *	@LOG @DEBUG @INFO
  *	This log written by ::==> {{ `` }}
  *
  *	Please remove your log after debugging
  */
  console.log(" ============= ");
  console.group("prRess ------ ");
  console.log();
  console.info({ prRes }, " ------ ");
  console.log();
  console.groupEnd();
  console.log(" ============= ");


  if (!prRes.success || !prRes.body?.[0]) {
    notFound()
  }

  const pr = prRes.body[0]

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let userUnitId: string | undefined

  if (activeRoleId) {
    const userRes = await getMe({
      _id: 1,
      roles: 1,
    } as any).catch(() => ({ success: false, body: null }))
    const currentUser = userRes.success ? userRes.body : null
    const activeRole = currentUser?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      userUnitId = activeRole.scopeId
    }
  }

  const approvals = pr.stepApprovals || []
  const goodsReceipts = pr.goodsReceipts || []
  const paymentOrders = pr.paymentOrders || []
  const tenders = pr.tenders || []

  const currentStepIdx = pr.currentStep ?? 0

  const stepsForResolution: StepWithApprovals[] = [...(pr.process?.steps || [])]
  const processDescription = pr.process?.description

  const sortedSteps = [...stepsForResolution].sort((a, b) => (a.order || 0) - (b.order || 0))

  const allUnitIds = [...new Set(
    sortedSteps.flatMap((s) =>
      (s.assigneeGroups || []).flatMap((g) => g.unitIds || [])
    )
  )]

  const hasStepsWithoutPendingApprovals = sortedSteps.some(
    (s) => !s.approvals || s.approvals.length === 0
  )

  let unitsById: Record<string, any> = {}
  if (allUnitIds.length > 0 && hasStepsWithoutPendingApprovals) {
    const unitsRes = await getUnits(
      { page: 1, limit: 200 } as any,
      {
        _id: 1,
        name: 1,
        head: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: { name: 1 } },
      } as any,
    )
    if (unitsRes.success) {
      const allUnits = unitsRes.body || []
      const idSet = new Set(allUnitIds)
      for (const u of allUnits) {
        if (idSet.has(u._id)) {
          unitsById[u._id] = u
        }
      }
    }
  }

  const stepResponsibleUnits: Record<string, any[]> = {}
  for (const step of sortedSteps) {
    const inlineUnits: any[] = []
    const seenIds = new Set<string>()
    for (const a of step.approvals || []) {
      if (a.unit?._id && !seenIds.has(a.unit._id)) {
        seenIds.add(a.unit._id)
        inlineUnits.push(a.unit)
      }
    }
    if (inlineUnits.length > 0) {
      stepResponsibleUnits[step._id] = inlineUnits
    } else {
      const groups = step.assigneeGroups || []
      const unitIds = [...new Set(groups.flatMap((g) => g.unitIds || []))]
      stepResponsibleUnits[step._id] = (unitIds as string[]).map((id) => unitsById[id]).filter(Boolean)
    }
  }

  const currentStep = sortedSteps[currentStepIdx] || null

  function isStepFullyApproved(stepId: string): boolean {
    const stepApprovals = (pr.stepApprovals || []).filter((a: any) => a.processStep?._id === stepId)
    const stepUnits = stepResponsibleUnits[stepId] || []
    if (stepUnits.length === 0) return false
    return stepUnits.every((unit: any) =>
      stepApprovals.some((a: any) => a.unit?._id === unit._id && a.status === "approved")
    )
  }

  let effectiveStep = currentStep
  const prStatus = (pr.status || "").toLowerCase()
  if (!["completed", "rejected", "cancelled"].includes(prStatus) && currentStep?._id && isStepFullyApproved(currentStep._id)) {
    const nextIdx = sortedSteps.findIndex(
      (s) => (s.order || 0) > (currentStep?.order || 0) && !isStepFullyApproved(s._id)
    )
    if (nextIdx !== -1) {
      effectiveStep = sortedSteps[nextIdx]
    }
  }

  const actionableTender = tenders.find((t: any) => t.status === "active" || t.status === "open" || t.status === "closed")
  const tenderWithSelection = pr.selectionType === "tender"
  const completedTender = tenders.find((t: any) => t.status === "awarded" || t.status === "closed")
  const hasActiveTenderOrSelected = actionableTender || completedTender || tenderWithSelection

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/unit-head/requests"
          className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
        >
          <ArrowRight className="size-4" />
          بازگشت به لیست
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                    <ShoppingCart className="size-5 text-electric-iris" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium text-frost-link leading-6">
                      {pr.title || "درخواست خرید"}
                    </CardTitle>
                    <StatusBadge status={pr.status || "Draft"} label={statusMap[pr.status?.toLowerCase() || "draft"] || pr.status} className="mt-1" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-fog">تعداد</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.quantity?.toLocaleString("fa-IR") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">واحد درخواست‌کننده</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.requestingUnit?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">مدل کالا</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.wareModel?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">درخواست‌دهنده</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.requester
                      ? `${pr.requester.first_name || ""} ${pr.requester.last_name || ""}`.trim() || "—"
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">فرآیند</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.process?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">خط بودجه</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.budgetLine
                      ? `${pr.budgetLine.code || ""} ${pr.budgetLine.title || ""}`.trim()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">تاریخ ایجاد</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.createdAt ? new Date(pr.createdAt).toLocaleDateString("fa-IR") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">تاریخ بروزرسانی</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.updatedAt ? new Date(pr.updatedAt).toLocaleDateString("fa-IR") : "—"}
                  </p>
                </div>
              </div>

              {pr.description && (
                <div className="mt-4 pt-4 border-t border-steel-border/10">
                  <p className="text-xs text-fog mb-1">توضیحات</p>
                  <p className="text-sm text-moonlight whitespace-pre-wrap">{pr.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {pr.process?.steps && pr.process.steps.length > 0 && (
            <>
              {processDescription && (
                <Card variant="glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                        <FileText className="size-4 text-electric-iris" />
                      </div>
                      <CardTitle className="text-sm font-medium text-moonlight">توضیحات فرآیند</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-fog/70 whitespace-pre-wrap leading-7">{processDescription}</p>
                  </CardContent>
                </Card>
              )}
              <WorkflowVisualizer
                steps={sortedSteps}
                currentStepIndex={currentStepIdx}
                status={pr.status}
                approvals={approvals}
                stepResponsibleUnits={stepResponsibleUnits}
              />
            </>
          )}

          <HistoryTimeline history={pr.history || []} />

          {pr.stuff && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-inset ring-amber-500/15">
                    <ClipboardList className="size-4 text-amber-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-moonlight">کالای تخصیص داده شده</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-moonlight">
                      {pr.stuff.quantity != null ? pr.stuff.quantity.toLocaleString("fa-IR") : "—"}
                    </span>
                    {pr.stuffStatus && (
                      <span className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full font-medium",
                        pr.stuffStatus === "assigned" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          pr.stuffStatus === "received" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            pr.stuffStatus === "cancelled" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                              "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      )}>
                        {pr.stuffStatus === "assigned" ? "تخصیص داده شده" :
                          pr.stuffStatus === "received" ? "دریافت شده" :
                            pr.stuffStatus === "cancelled" ? "لغو شده" : "—"}
                      </span>
                    )}
                  </div>
                  {pr.wareModel?.name && (
                    <p className="text-xs text-fog/70">{pr.wareModel.name}</p>
                  )}
                  {pr.estimatedAmount != null && (
                    <div className="flex items-center gap-4 text-xs text-fog/50 mt-2">
                      <span>مبلغ برآوردی: {Number(pr.estimatedAmount).toLocaleString("fa-IR")} تومان</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <TendersList tenders={tenders} purchasingRequestId={id} />

          {goodsReceipts.length > 0 && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-inset ring-teal-500/15">
                    <Package className="size-4 text-teal-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-moonlight">رسید کالا</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-steel-border/10">
                  {goodsReceipts.map((gr: Record<string, unknown>) => (
                    <div key={String(gr._id)} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-moonlight">
                          {String(gr.receiptNumber || "—")}
                        </span>
                        <StatusBadge status={String(gr.status || "")} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-fog/50">
                        <span>تعداد: {Number((gr.items as any[])?.[0]?.quantityReceived || 0).toLocaleString("fa-IR")}</span>
                        {gr.receivedAt && (
                          <span>{new Date(String(gr.receivedAt)).toLocaleDateString("fa-IR")}</span>
                        )}
                      </div>
                      {gr.notes && (
                        <p className="text-xs text-fog/40 mt-1">{String(gr.notes)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {paymentOrders.length > 0 && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
                    <FileText className="size-4 text-violet-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-moonlight">دستورات پرداخت</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-steel-border/10">
                  {paymentOrders.map((po: Record<string, unknown>) => (
                    <div key={String(po._id)} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-moonlight">
                          {String(po.title || "—")}
                        </span>
                        <span className="text-sm text-moonlight">
                          {Number(po.amount || 0).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-fog/50">
                        <StatusBadge status={String(po.status || "")} />
                        {po.paidAt && (
                          <span>
                            پرداخت: {new Date(String(po.paidAt)).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-fog">وضعیت</p>
                <StatusBadge status={pr.status || "Draft"} label={statusMap[pr.status?.toLowerCase() || "draft"] || pr.status} className="mt-1" />
              </div>
              {pr.selectionType && pr.selectionType !== "none" && (
                <div>
                  <p className="text-xs text-fog">نحوه تأمین</p>
                  <p className="text-moonlight">
                    {pr.selectionType === "stuff"
                      ? "تخصیص کالا"
                      : pr.selectionType === "tender"
                        ? "مناقصه"
                        : "—"}
                  </p>
                </div>
              )}
              {pr.requester && (
                <div>
                  <p className="text-xs text-fog">ثبت‌کننده</p>
                  <p className="text-moonlight">
                    {pr.requester.first_name || ""} {pr.requester.last_name || ""}
                  </p>
                </div>
              )}
              {pr.createdAt && (
                <div>
                  <p className="text-xs text-fog">تاریخ ثبت</p>
                  <p className="text-moonlight">{new Date(pr.createdAt).toLocaleDateString("fa-IR")}</p>
                </div>
              )}
              {pr.updatedAt && (
                <div>
                  <p className="text-xs text-fog">آخرین بروزرسانی</p>
                  <p className="text-moonlight">{new Date(pr.updatedAt).toLocaleDateString("fa-IR")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {pr.requestingUnit && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-frost-link/60" />
                  <CardTitle className="text-sm font-medium text-fog">واحد درخواست‌کننده</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-moonlight font-medium">{pr.requestingUnit.name}</p>
              </CardContent>
            </Card>
          )}

          {pr.budgetLine && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-frost-link/60" />
                  <CardTitle className="text-sm font-medium text-fog">خط بودجه</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {pr.budgetLine.code && (
                  <div>
                    <p className="text-xs text-fog">کد</p>
                    <p className="text-moonlight">{pr.budgetLine.code}</p>
                  </div>
                )}
                {pr.budgetLine.title && (
                  <div>
                    <p className="text-xs text-fog">عنوان</p>
                    <p className="text-moonlight">{pr.budgetLine.title}</p>
                  </div>
                )}
                {pr.budgetLine.totalAllocated != null && (
                  <div>
                    <p className="text-xs text-fog">تخصیص کل</p>
                    <p className="text-moonlight font-medium">
                      {Number(pr.budgetLine.totalAllocated).toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                )}
                {pr.budgetLine.totalEncumbered != null && (
                  <div>
                    <p className="text-xs text-fog">تعهد شده</p>
                    <p className="text-moonlight font-medium">
                      {Number(pr.budgetLine.totalEncumbered).toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                )}
                {pr.budgetLine.totalAllocated != null && pr.budgetLine.totalEncumbered != null && (
                  <div>
                    <p className="text-xs text-fog">مانده</p>
                    <p className="text-moonlight font-medium text-emerald-400">
                      {Number(pr.budgetLine.totalAllocated - pr.budgetLine.totalEncumbered).toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {pr.store && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Store className="size-4 text-frost-link/60" />
                  <CardTitle className="text-sm font-medium text-fog">فروشگاه / انبار</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-moonlight font-medium">{pr.store.name}</p>
                {pr.store.address && (
                  <p className="text-xs text-fog/50">{pr.store.address}</p>
                )}
              </CardContent>
            </Card>
          )}

          {actionableTender && <ActiveTenderCard tender={actionableTender} purchasingRequestId={id} selectedTenderOfferId={pr.selectedTenderOfferId} />}

          {pr.status === "Draft" ? (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-fog">عملیات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <UnitHeadActions
                  purchasingRequestId={pr._id || id}
                  wareModelId={pr.wareModel?._id}
                  quantity={pr.quantity}
                  tenderCount={tenders.length}
                  hasCompletedTender={!!hasActiveTenderOrSelected}
                  selectionType={pr.selectionType}
                  isDraft
                />
              </CardContent>
            </Card>
          ) : pr.status !== "completed" && pr.status !== "rejected" ? (
            <>
              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-fog">عملیات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <UnitHeadActions
                    purchasingRequestId={pr._id || id}
                    wareModelId={pr.wareModel?._id}
                    quantity={pr.quantity}
                    tenderCount={tenders.length}
                    hasCompletedTender={!!hasActiveTenderOrSelected}
                    selectionType={pr.selectionType}
                  />
                </CardContent>
              </Card>
              <StepApprovalPanel
                purchasingRequestId={pr._id || id}
                processStep={effectiveStep}
                unitId={userUnitId || ""}
                existingApprovals={approvals}
              />
            </>
          ) : (
            <StepApprovalPanel
              purchasingRequestId={pr._id || id}
              processStep={effectiveStep}
              unitId={userUnitId || ""}
              existingApprovals={approvals}
            />
          )}
        </div>
      </div>
    </div>
  )
}
