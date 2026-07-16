import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ShoppingCart, Building2, Landmark, Store, Package, ClipboardList, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { get as getPR } from "@/app/actions/purchasingRequest/get"
import { gets as getApprovals } from "@/app/actions/stepApproval/gets"
import { gets as getGoodsReceipts } from "@/app/actions/goodsReceipt/gets"
import { gets as getPOItems } from "@/app/actions/purchaseOrderItem/gets"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { WorkflowVisualizer } from "@/components/purchasing/workflow-visualizer"
import { HistoryTimeline } from "@/components/purchasing/history-timeline"
import { ReceiveGoodsButton } from "./receive-goods-button"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"

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

export default async function RequestDetailPage({
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
      estimatedAmount: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      updatedAt: 1,
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
    },
  )

  if (!prRes.success || !prRes.body?.[0]) {
    notFound()
  }

  const pr = prRes.body[0]

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let userUnitId: string | undefined
  let isCurrentUserRequester = false

  if (activeRoleId) {
    const userRes = await getUser({}, {
      _id: 1,
      roles: { roleId: 1, scopeId: 1, scopeType: 1, name: 1 },
    }).catch(() => ({ success: false, body: null }))
    const currentUser = userRes.success ? userRes.body : null
    const activeRole = currentUser?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      userUnitId = activeRole.scopeId
    }
    isCurrentUserRequester = currentUser?._id === pr.requester?._id
  }

  const canReceive = pr.status === "approved" && isCurrentUserRequester && pr.wareModel?._id && userUnitId

  const [approvalsRes, grRes, poiRes, poRes] = await Promise.all([
    getApprovals(
      { page: 1, limit: 50, filter: { purchasingRequestId: id } } as any,
      {
        _id: 1,
        status: 1,
        comment: 1,
        decidedAt: 1,
        processStep: { _id: 1, name: 1 },
        unit: { _id: 1, name: 1 },
        decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: { name: 1 } },
      },
    ),
    getGoodsReceipts(
      { page: 1, limit: 20, purchasingRequestId: id },
      { _id: 1, receiptNumber: 1, quantityReceived: 1, receivedAt: 1, status: 1, notes: 1 },
    ),
    getPOItems(
      { page: 1, limit: 20, purchasingRequestId: id },
      { _id: 1, quantity: 1, unitPrice: 1, totalPrice: 1, status: 1, assignedFrom: { _id: 1, name: 1 } },
    ),
    getPaymentOrders(
      { page: 1, limit: 20, purchasingRequestId: id },
      { _id: 1, title: 1, amount: 1, status: 1, paidAt: 1 },
    ),
  ])

  const approvals = approvalsRes.success ? approvalsRes.body || [] : []
  const goodsReceipts = grRes.success ? grRes.body || [] : []
  const purchaseOrderItems = poiRes.success ? poiRes.body || [] : []
  const paymentOrders = poRes.success ? poRes.body || [] : []

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/requests/my-requests"
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
                    <StatusBadge status={pr.status || "draft"} labelMap={statusMap} className="mt-1" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-fog">مبلغ تخمینی</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.estimatedAmount?.toLocaleString("fa-IR") || "—"} تومان
                  </p>
                </div>
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

          {sortedSteps.length > 0 && (
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
                        <span>تعداد: {Number(gr.quantityReceived || 0).toLocaleString("fa-IR")}</span>
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

          {purchaseOrderItems.length > 0 && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-inset ring-amber-500/15">
                    <ClipboardList className="size-4 text-amber-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-moonlight">آیتم‌های سفارش خرید</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-steel-border/10">
                  {purchaseOrderItems.map((poi: Record<string, unknown>) => (
                    <div key={String(poi._id)} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-moonlight">
                          {Number(poi.quantity || 0).toLocaleString("fa-IR")} عدد
                        </span>
                        <span className="text-sm text-moonlight">
                          {Number(poi.totalPrice || poi.unitPrice || 0).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-fog/50">
                        <span>قیمت واحد: {Number(poi.unitPrice || 0).toLocaleString("fa-IR")} تومان</span>
                        <StatusBadge status={String(poi.status || "")} />
                      </div>
                      {poi.assignedFrom && (
                        <p className="text-xs text-fog/40 mt-1">
                          فروشنده: {(poi.assignedFrom as Record<string, unknown>).name as string || "—"}
                        </p>
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
                <StatusBadge status={pr.status || "draft"} labelMap={statusMap} className="mt-1" />
              </div>
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

          {canReceive && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-fog">دریافت کالا</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-fog mb-3">
                  پس از دریافت کالا، موجودی انبار واحد شما به‌روزرسانی خواهد شد.
                </p>
                <ReceiveGoodsButton
                  purchasingRequestId={pr._id}
                  wareModelId={pr.wareModel._id}
                  quantity={pr.quantity || 1}
                  unitId={userUnitId || ""}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
