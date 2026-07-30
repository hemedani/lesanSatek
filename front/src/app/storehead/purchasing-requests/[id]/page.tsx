"use client"

import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowRight, ShoppingCart, Package, Calendar, Building2, BadgeCheck, Store, BarChart3, FileText, Landmark } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { HistoryTimeline } from "@/components/purchasing/history-timeline"
import { cn } from "@/lib/utils"
import { get } from "@/app/actions/purchasingRequest/get"
import { updateStuffStatus } from "@/app/actions/purchasingRequest/updateStuffStatus"
import { useAuthStore } from "@/stores/authStore"

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  sent_to_finance: "ارجاع به مالی",
  paid: "پرداخت شده",
  cancelled: "لغو شده",
}

const STUFF_STATUS_LABELS: Record<string, string> = {
  assigned: "تخصیص داده شده",
  ready_to_ship: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
}

const STUFF_STATUS_COLORS: Record<string, string> = {
  assigned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ready_to_ship: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  shipped: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

const STATUS_STEPS = ["assigned", "ready_to_ship", "shipped", "delivered"]

const STEP_LABELS: Record<string, string> = {
  assigned: "تخصیص",
  ready_to_ship: "آماده‌سازی",
  shipped: "ارسال",
  delivered: "تحویل",
}

const BUTTON_LABELS: Record<string, string> = {
  ready_to_ship: "آماده ارسال",
  shipped: "ارسال شد",
  delivered: "تحویل داده شد",
}

const CONFIRM_MESSAGES: Record<string, { title: string; description: string }> = {
  ready_to_ship: {
    title: "تأیید آماده‌سازی",
    description: "آیا از آماده بودن کالا برای ارسال اطمینان دارید؟",
  },
  shipped: {
    title: "تأیید ارسال",
    description: "آیا از ارسال کالا اطمینان دارید؟",
  },
  delivered: {
    title: "تأیید تحویل",
    description: "آیا از تحویل کالا به مقصد اطمینان دارید؟",
  },
}

interface PR {
  _id: string
  title?: string
  description?: string
  status?: string
  quantity?: number
  estimatedAmount?: number
  stuffStatus?: string
  createdAt?: string
  process?: { _id?: string; name?: string }
  requestingUnit?: { _id?: string; name?: string }
  wareModel?: { _id?: string; name?: string; enName?: string }
  stuff?: { _id?: string; quantity?: number; price?: number }
  ware?: { name?: string; brand?: string }
  store?: { _id?: string; name?: string }
  history?: { action?: string; performed?: { by?: string; name?: string; at?: string } }[]
  paymentOrders?: { _id: string; title?: string; amount?: number; status?: string; paidAt?: string }[]
}

export default function StorePRDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pr, setPr] = useState<PR | null>(null)
  const [updating, setUpdating] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)

  useEffect(() => {
    ; (async () => {
      const result = await get(
        { activeRoleId: "", _id: id },
        {
          _id: 1,
          title: 1,
          description: 1,
          status: 1,
          quantity: 1,
          estimatedAmount: 1,
          stuffStatus: 1,
          createdAt: 1,
          process: { _id: 1, name: 1 },
          requestingUnit: { _id: 1, name: 1 },
          wareModel: { _id: 1, name: 1, enName: 1 },
          stuff: { _id: 1, quantity: 1, price: 1 },
          ware: { name: 1, brand: 1 },
          store: { _id: 1, name: 1 },
          paymentOrders: { _id: 1, title: 1, amount: 1, status: 1, paidAt: 1 },
          history: 1,
        },
      )
      if (result.success && result.body?.[0]) {
        setPr(result.body[0])
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })()
  }, [id])

  const currentStepIndex = pr?.stuffStatus ? STATUS_STEPS.indexOf(pr.stuffStatus) : -1
  const nextStep = currentStepIndex >= 0 && currentStepIndex < STATUS_STEPS.length - 1
    ? STATUS_STEPS[currentStepIndex + 1]
    : null

  const handleStatusUpdate = async (nextStatus: string) => {
    if (!pr) return
    setUpdating(true)
    setConfirmTarget(null)
    try {
      const result = await updateStuffStatus({ activeRoleId: "", _id: pr._id, stuffStatus: nextStatus as any })
      if (result.success) {
        setPr({ ...pr, stuffStatus: nextStatus })
        toast.success(`وضعیت کالا به "${STUFF_STATUS_LABELS[nextStatus]}" تغییر یافت`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی وضعیت کالا")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی وضعیت کالا")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (notFound || !pr) {
    return (
      <div className="space-y-6">
        <ErrorState title="درخواست خرید یافت نشد" message="درخواست مورد نظر وجود ندارد." />
        <div className="flex justify-center mt-4">
          <Button variant="ghost" size="sm" className="text-frost-link" onClick={() => router.push("/storehead/purchasing-requests")}>
            <ArrowRight className="size-4 ms-1" />
            بازگشت به لیست
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-steel-border/50">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/storehead/purchasing-requests")} className="shrink-0 rounded-lg">
            <ArrowRight className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
              {pr.title || "بدون عنوان"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <RequestStatusBadge status={pr.status} />
              {pr.process?.name && (
                <span className="text-[11px] px-2 py-0.5 rounded-sm bg-white/[0.03] text-fog/60 border border-steel-border/30">
                  {pr.process.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stuff Status Stepper */}
          {pr.stuffStatus && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BadgeCheck className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle>وضعیت کالا</CardTitle>
                    <CardDescription>مراحل ارسال کالا</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stepper */}
                <div className="flex items-center justify-between mb-6">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex
                    const isNext = index === currentStepIndex + 1

                    return (
                      <div key={step} className="flex-1 flex flex-col items-center relative">
                        {index > 0 && (
                          <div
                            className={cn(
                              "absolute top-4 -start-1/2 w-full h-0.5 -translate-y-1/2",
                              isCompleted ? "bg-emerald-500/60" : "bg-steel-border/30",
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            "size-8 rounded-full flex items-center justify-center text-xs font-semibold relative z-10 transition-all duration-300",
                            isCompleted ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50" : "",
                            isCurrent ? "bg-electric-iris/20 text-electric-iris border-2 border-electric-iris/50 ring-2 ring-electric-iris/20" : "",
                            !isCompleted && !isCurrent ? "bg-white/[0.03] text-fog/40 border-2 border-steel-border/30" : "",
                          )}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] mt-1.5 font-medium",
                            isCompleted ? "text-emerald-400" : "",
                            isCurrent ? "text-electric-iris" : "",
                            !isCompleted && !isCurrent ? "text-fog/40" : "",
                          )}
                        >
                          {STEP_LABELS[step]}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Action button */}
                {nextStep && (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setConfirmTarget(nextStep)}
                      disabled={updating}
                      size="sm"
                      className="gap-2"
                    >
                      {updating ? "در حال به‌روزرسانی..." : BUTTON_LABELS[nextStep]}
                    </Button>
                  </div>
                )}

                {!nextStep && pr.stuffStatus === "delivered" && (
                  <p className="text-center text-sm text-emerald-400/70">کالا تحویل داده شده است.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {pr.description && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                    <FileText className="size-4 text-electric-iris" />
                  </div>
                  <CardTitle>توضیحات</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-moonlight/80 leading-relaxed">{pr.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Orders */}
          {pr.paymentOrders && pr.paymentOrders.length > 0 && (
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
                    <Landmark className="size-4 text-violet-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-moonlight">دستورات پرداخت</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-steel-border/10">
                  {pr.paymentOrders.map((po) => (
                    <div key={po._id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-moonlight">
                          {po.title || "—"}
                        </span>
                        <span className="text-sm text-moonlight">
                          {Number(po.amount || 0).toLocaleString("fa-IR")} ریال
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-fog/50">
                        <StatusBadge status={po.status || ""} labelMap={PAYMENT_STATUS_LABELS} />
                        {po.paidAt && (
                          <span>
                            پرداخت: {new Date(po.paidAt).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {pr.history && pr.history.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                    <Calendar className="size-4 text-electric-iris" />
                  </div>
                  <CardTitle>تاریخچه اقدامات</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <HistoryTimeline history={pr.history} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <ShoppingCart className="size-4 text-electric-iris" />
                </div>
                <CardTitle>اطلاعات درخواست</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={Package} label="تعداد" value={pr.quantity != null ? pr.quantity.toLocaleString("fa-IR") : "—"} />
                {pr.estimatedAmount != null && (
                  <InfoRow icon={Store} label="مبلغ برآوردی" value={`${pr.estimatedAmount.toLocaleString("fa-IR")} ریال`} />
                )}
                <InfoRow icon={Building2} label="واحد درخواست‌کننده" value={pr.requestingUnit?.name || "—"} />
                {pr.wareModel?.name && (
                  <InfoRow
                    icon={BarChart3}
                    label="مدل کالا"
                    value={
                      <div>
                        <span>{pr.wareModel.name}</span>
                        {pr.wareModel.enName && (
                          <span className="text-fog/50 text-xs me-2">({pr.wareModel.enName})</span>
                        )}
                      </div>
                    }
                  />
                )}
                <InfoRow
                  icon={BadgeCheck}
                  label="وضعیت کالا"
                  value={
                    <Badge className={cn("text-[10px]", STUFF_STATUS_COLORS[pr.stuffStatus || "assigned"])}>
                      {STUFF_STATUS_LABELS[pr.stuffStatus || "assigned"]}
                    </Badge>
                  }
                />
                {pr.process?.name && (
                  <InfoRow icon={BarChart3} label="فرآیند" value={pr.process.name} />
                )}
                <InfoRow
                  icon={Calendar}
                  label="تاریخ ایجاد"
                  value={pr.createdAt ? new Date(pr.createdAt).toLocaleDateString("fa-IR") : "—"}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}
        title={confirmTarget ? CONFIRM_MESSAGES[confirmTarget]?.title || "تأیید" : ""}
        description={confirmTarget ? CONFIRM_MESSAGES[confirmTarget]?.description || "" : ""}
        confirmLabel="تأیید"
        onConfirm={() => confirmTarget && handleStatusUpdate(confirmTarget)}
        loading={updating}
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-steel-border/20 last:border-b-0">
      <div className="size-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
        <Icon className="size-4 text-fog/50" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fog/50">{label}</p>
        <div className="text-sm text-moonlight mt-0.5">{value}</div>
      </div>
    </div>
  )
}
