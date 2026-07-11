import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { get as getPR } from "@/app/actions/purchasingRequest/get"
import { gets as getApprovals } from "@/app/actions/stepApproval/gets"
import { get as getStep } from "@/app/actions/processStep/get"
import { getUser } from "@/app/actions/user/getUser"
import { WorkflowVisualizer } from "@/components/purchasing/workflow-visualizer"
import { HistoryTimeline } from "@/components/purchasing/history-timeline"
import { StepApprovalPanel } from "@/components/purchasing/step-approval-panel"
import { cookies } from "next/headers"

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
      estimatedAmount: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      updatedAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      process: { _id: 1, name: 1, steps: { _id: 1, name: 1, order: 1 } },
      wareModel: { _id: 1, name: 1 },
    },
  )

  if (!prRes.success || !prRes.body?.[0]) {
    notFound()
  }

  const pr = prRes.body[0]

  const approvalsRes = await getApprovals(
    { page: 1, limit: 50, filter: { purchasingRequestId: id } },
    { _id: 1, status: 1, comment: 1, createdAt: 1, approver: { _id: 1, first_name: 1, last_name: 1 } },
  )
  const approvals = approvalsRes.success ? approvalsRes.body || [] : []

  let currentProcessStep = null
  if (pr.currentStep) {
    const stepRes = await getStep({ _id: pr.currentStep }, { _id: 1, name: 1, description: 1 })
    if (stepRes.success && stepRes.body?.[0]) {
      currentProcessStep = stepRes.body[0]
    }
  }

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let unitId = ""

  if (activeRoleId) {
    const userRes = await getUser({}, {
      _id: 1,
      roles: { roleId: 1, scopeId: 1, scopeType: 1, name: 1 },
    }).catch(() => ({ success: false, body: null }))
    const user = userRes.success ? userRes.body : null
    const activeRole = user?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      unitId = activeRole.scopeId
    }
  }

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
                    <StatusBadge status={pr.status || "draft"} labelMap={statusMap} className="mt-1" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-xs text-fog">درخواست‌دهنده</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.requester
                      ? `${pr.requester.first_name || ""} ${pr.requester.last_name || ""}`.trim() || "—"
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">مدل کالا</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.wareModel?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">تاریخ ایجاد</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.createdAt ? new Date(pr.createdAt).toLocaleDateString("fa-IR") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-fog">فرآیند</p>
                  <p className="text-sm text-moonlight font-medium">
                    {pr.process?.name || "—"}
                  </p>
                </div>
              </div>

              {pr.description && (
                <div>
                  <p className="text-xs text-fog mb-1">توضیحات</p>
                  <p className="text-sm text-moonlight">{pr.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {pr.process?.steps && pr.process.steps.length > 0 && (
            <WorkflowVisualizer
              steps={pr.process.steps}
              currentStepId={pr.currentStep}
              approvals={approvals}
            />
          )}

          <HistoryTimeline approvals={approvals} />
        </div>

        <div className="space-y-6">
          <StepApprovalPanel
            purchasingRequestId={pr._id || id}
            processStep={currentProcessStep}
            unitId={unitId}
            existingApprovals={approvals}
          />
        </div>
      </div>
    </div>
  )
}
