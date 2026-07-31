import { notFound } from "next/navigation"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  ShoppingCart,
  Building2,
  Landmark,
  Store,
  Package,
  ClipboardList,
  FileText,
  Gavel,
  BadgeCheck,
  User,
  CalendarDays,
  GitBranch,
  Coins,
  RefreshCw,
  CreditCard,
  Zap,
  PackageCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { get as getPR } from "@/app/actions/purchasingRequest/get"
import { gets as getApprovals } from "@/app/actions/stepApproval/gets"
import { gets as getGoodsReceipts } from "@/app/actions/goodsReceipt/gets"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"
import { gets as getTenderOffers } from "@/app/actions/tenderOffer/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { WorkflowVisualizer } from "@/components/purchasing/workflow-visualizer"
import { HistoryTimeline } from "@/components/purchasing/history-timeline"
import { ReceiveGoodsButton } from "./receive-goods-button"
import { SubmitPRButton } from "./submit-pr-button"
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

interface ResponsibleUnit {
  _id?: string
  name?: string
  head?: { _id?: string; first_name?: string; last_name?: string; position?: string; roles?: { name?: string }[] }
}

interface TenderOffer {
  _id: string
  price?: number
  deliveryTime?: number
  paymentTerms?: string
  description?: string
  status?: string
  submittedAt?: string
  store?: { _id: string; name?: string }
}

interface GoodsReceiptItem {
  wareModelName?: string
  wareName?: string
  quantityReceived?: number
}

interface GoodsReceipt {
  _id?: string
  receiptNumber?: string
  receivedAt?: string
  status?: string
  notes?: string
  items?: GoodsReceiptItem[]
  receivingUnit?: { _id?: string; name?: string }
  receivedBy?: { _id?: string; first_name?: string; last_name?: string }
}

interface PaymentOrder {
  _id?: string
  title?: string
  amount?: number
  status?: string
  paidAt?: string
}

interface Tender {
  _id: string
  title?: string
  description?: string
  status?: string
  deadline?: string
  createdAt?: string
}

const statusMap: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
  pendingfinalization: "در انتظار نهایی‌سازی",
  cancelled: "لغو شده",
}

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR")
}

function fullName(p?: { first_name?: string; last_name?: string }): string {
  if (!p) return "—"
  return `${p.first_name || ""} ${p.last_name || ""}`.trim() || "—"
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  badge,
  children,
  className,
}: {
  icon: LucideIcon
  iconClassName?: string
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card variant="glass" className={cn("[--card-spacing:--spacing(6)]", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20"
              )}
            >
              <Icon className="size-5" />
            </div>
            <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
  valueDir,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  valueDir?: "ltr"
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] ring-1 ring-inset ring-steel-border/20">
        <Icon className="size-[18px] text-frost-link/80" />
      </div>
      <div className="min-w-0">
        <p className="text-caption text-fog">{label}</p>
        <p className="mt-0.5 truncate text-body-sm font-medium text-moonlight" dir={valueDir}>
          {value}
        </p>
      </div>
    </div>
  )
}

function stuffStatusBadge(status?: string) {
  const map: Record<string, { label: string; cls: string }> = {
    assigned: { label: "تخصیص داده شده", cls: "bg-azure/10 text-azure border-azure/25" },
    ready_to_ship: { label: "آماده ارسال", cls: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
    shipped: { label: "ارسال شده", cls: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
    delivered: { label: "تحویل داده شده", cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" },
    received: { label: "دریافت شده", cls: "bg-cipher-mint/10 text-cipher-mint border-cipher-mint/25" },
    cancelled: { label: "لغو شده", cls: "bg-rose-500/10 text-rose-400 border-rose-500/25" },
  }
  const cfg = status ? map[status.toLowerCase()] : undefined
  if (!cfg) return null
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-body-sm font-medium", cfg.cls)}>
      {cfg.label}
    </span>
  )
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
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      updatedAt: 1,
      stuff: { _id: 1, quantity: 1, price: 1 },
      stuffStatus: 1,
      completedAt: 1,
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
      tenders: {
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        deadline: 1,
        createdAt: 1,
      },
      selectedTenderOfferId: 1,
      history: 1,
    },
  )

  if (!prRes.success || !prRes.body?.[0]) {
    notFound()
  }

  const pr = prRes.body[0]

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let isCurrentUserRequester = false
  let currentUserId: string | undefined
  let isWarehouseHead = false
  let warehouseUnitId: string | undefined

  if (activeRoleId) {
    const userRes = await getMe({
      _id: 1,
      roles: 1,
    }).catch(() => ({ success: false, body: null }))
    const currentUser = userRes.success ? userRes.body : null
    currentUserId = currentUser?._id
    isCurrentUserRequester = currentUser?._id === pr.requester?._id
  }
  if (currentUserId) {
    const warehouseUnitsRes = await getUnits(
      { page: 1, limit: 50, type: "Warehouse" },
      { _id: 1, name: 1, head: { _id: 1 } }
    ).catch(() => ({ success: false, body: null }))
    if (warehouseUnitsRes.success && warehouseUnitsRes.body) {
      const userWarehouse = warehouseUnitsRes.body.find(
        (u: { head?: { _id?: string } }) => u.head?._id === currentUserId
      )
      if (userWarehouse) {
        isWarehouseHead = true
        warehouseUnitId = userWarehouse._id
      }
    }
  }

  const receiveUnitId = isCurrentUserRequester ? pr.requestingUnit?._id : warehouseUnitId
  const canReceive = pr.stuffStatus === "delivered" && pr.wareModel?._id && ((isCurrentUserRequester && pr.requestingUnit?._id) || (isWarehouseHead && warehouseUnitId))
  const isDraft = String(pr.status || "").toLowerCase() === "draft"

  const [approvalsRes, grRes, poRes] = await Promise.all([
    getApprovals(
      { page: 1, limit: 50, purchasingRequestId: id },
      {
        _id: 1,
        status: 1,
        comment: 1,
        decidedAt: 1,
        processStep: { _id: 1, name: 1 },
        unit: { _id: 1, name: 1 },
        decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: 1 },
      },
    ),
    getGoodsReceipts(
      { page: 1, limit: 20, purchasingRequestId: id },
      {
        _id: 1, receiptNumber: 1, receivedAt: 1, status: 1, notes: 1,
        items: 1,
        receivingUnit: { _id: 1, name: 1 },
        receivedBy: { _id: 1, first_name: 1, last_name: 1 },
      },
    ),
    getPaymentOrders(
      { page: 1, limit: 20, purchasingRequestId: id },
      { _id: 1, title: 1, amount: 1, status: 1, paidAt: 1 },
    ),
  ])

  const approvals: StepApprovalInline[] = approvalsRes.success ? approvalsRes.body || [] : []
  const goodsReceipts: GoodsReceipt[] = grRes.success ? grRes.body || [] : []
  const paymentOrders: PaymentOrder[] = poRes.success ? poRes.body || [] : []

  const tenders: Tender[] = pr.tenders || []
  const selectedTenderOfferId = pr.selectedTenderOfferId

  const tenderOffersRes = await Promise.all(
    tenders.map((t: { _id: string }) =>
      getTenderOffers(
        { page: 1, limit: 100, tenderId: t._id },
        {
          _id: 1,
          price: 1,
          deliveryTime: 1,
          paymentTerms: 1,
          description: 1,
          status: 1,
          submittedAt: 1,
          store: { _id: 1, name: 1 },
        },
      )
    )
  )
  const offersByTenderId: Record<string, TenderOffer[]> = {}
  tenders.forEach((t: { _id: string }, idx: number) => {
    const res = tenderOffersRes[idx]
    offersByTenderId[t._id] = res?.success ? (res.body as TenderOffer[]) || [] : []
  })

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

  const unitsById: Record<string, ResponsibleUnit> = {}
  if (allUnitIds.length > 0 && hasStepsWithoutPendingApprovals) {
    const unitsRes = await getUnits(
      { page: 1, limit: 200 },
      {
        _id: 1,
        name: 1,
        head: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: 1 },
      },
    )
    if (unitsRes.success) {
      const allUnits = (unitsRes.body as ResponsibleUnit[]) || []
      const idSet = new Set(allUnitIds)
      for (const u of allUnits) {
        if (idSet.has(u._id!)) {
          unitsById[u._id!] = u
        }
      }
    }
  }

  const stepResponsibleUnits: Record<string, ResponsibleUnit[]> = {}
  for (const step of sortedSteps) {
    const inlineUnits: ResponsibleUnit[] = []
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
      stepResponsibleUnits[step._id] = unitIds
        .map((id) => unitsById[id])
        .filter((u): u is ResponsibleUnit => Boolean(u))
    }
  }

  const statusLabel = statusMap[pr.status?.toLowerCase() || "draft"] || pr.status || "—"
  const prStatus = pr.status || "draft"

  return (
    <div className="space-y-6">
      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link
        href="/requests/my-requests"
        className="inline-flex items-center gap-1.5 rounded-sm text-body-sm text-fog transition-colors hover:text-glacier focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowRight className="size-4" />
        بازگشت به لیست درخواست‌ها
      </Link>

      {/* ── 1. Page header ────────────────────────────────────────── */}
      <Card variant="glass" className="glass-card-conic-top [--card-spacing:--spacing(6)]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20 shadow-[0_0_28px_-8px_rgba(102,58,243,0.55)]">
                <ShoppingCart className="size-7 text-electric-iris" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-heading-sm font-semibold leading-8 text-glacier">
                    {pr.title || "درخواست خرید"}
                  </h1>
                  <StatusBadge
                    size="lg"
                    status={prStatus}
                    label={statusLabel}
                  />
                </div>
                <p className="mt-1.5 text-body-sm text-fog" dir="ltr">
                  شناسه: {pr._id}
                </p>
              </div>
            </div>

            {(isDraft || canReceive) && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {isDraft && (
                  <SubmitPRButton
                    purchasingRequestId={pr._id}
                    title={pr.title}
                    quantity={pr.quantity}
                    wareModelName={pr.wareModel?.name}
                    className="gap-2 w-full sm:w-auto"
                  />
                )}
                {canReceive && (
                  <ReceiveGoodsButton
                    purchasingRequestId={pr._id}
                    wareModelId={pr.wareModel._id}
                    quantity={pr.quantity || 1}
                    receivingUnitId={receiveUnitId || ""}
                    receivedById={currentUserId || ""}
                    wareModelName={pr.wareModel?.name}
                    className="gap-2 w-full sm:w-auto"
                  />
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 border-t border-steel-border/15 pt-4 sm:grid-cols-4">
            <MetaItem icon={User} label="درخواست‌دهنده" value={fullName(pr.requester)} />
            <MetaItem icon={Building2} label="واحد درخواست‌کننده" value={pr.requestingUnit?.name || "—"} />
            <MetaItem icon={CalendarDays} label="تاریخ ایجاد" value={faDate(pr.createdAt)} valueDir="ltr" />
            <MetaItem icon={GitBranch} label="فرآیند" value={pr.process?.name || "—"} />
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Process progress (hero) ────────────────────────────── */}
      {sortedSteps.length > 0 && (
        <WorkflowVisualizer
          steps={sortedSteps}
          currentStepIndex={currentStepIdx}
          status={pr.status}
          approvals={approvals}
          stepResponsibleUnits={stepResponsibleUnits}
        />
      )}

      {/* ── 3. Main content (two-column) ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {processDescription && (
            <SectionCard icon={FileText} title="توضیحات فرآیند" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
              <p className="text-body-sm leading-7 text-moonlight/80 whitespace-pre-wrap">{processDescription}</p>
            </SectionCard>
          )}

          <SectionCard icon={ClipboardList} title="مشخصات و توضیحات درخواست" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <MetaItem icon={Package} label="تعداد" value={pr.quantity?.toLocaleString("fa-IR") || "—"} valueDir="ltr" />
              <MetaItem icon={ShoppingCart} label="مدل کالا" value={pr.wareModel?.name || "—"} />
              <MetaItem icon={Landmark} label="خط بودجه" value={pr.budgetLine ? `${pr.budgetLine.code || ""} ${pr.budgetLine.title || ""}`.trim() : "—"} />
              <MetaItem icon={Coins} label="مبلغ برآوردی" value={pr.estimatedAmount != null ? `${Number(pr.estimatedAmount).toLocaleString("fa-IR")} تومان` : "—"} valueDir="ltr" />
              <MetaItem icon={CalendarDays} label="تاریخ ایجاد" value={faDate(pr.createdAt)} valueDir="ltr" />
              <MetaItem icon={RefreshCw} label="آخرین بروزرسانی" value={faDate(pr.updatedAt)} valueDir="ltr" />
            </div>

            {pr.description && (
              <div className="mt-5 rounded-xl border border-steel-border/20 bg-white/[0.02] p-4">
                <p className="mb-1.5 text-caption font-medium text-fog">توضیحات</p>
                <p className="text-body-sm leading-7 text-moonlight/80 whitespace-pre-wrap">{pr.description}</p>
              </div>
            )}
          </SectionCard>

          {pr.stuff && (
            <SectionCard
              icon={PackageCheck}
              title="کالای تخصیص داده شده"
              iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
              badge={stuffStatusBadge(pr.stuffStatus)}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MetaItem icon={Package} label="تعداد" value={pr.stuff.quantity != null ? pr.stuff.quantity.toLocaleString("fa-IR") : "—"} valueDir="ltr" />
                <MetaItem icon={ShoppingCart} label="مدل کالا" value={pr.wareModel?.name || "—"} />
                {pr.stuff.price != null && (
                  <MetaItem icon={Coins} label="قیمت" value={`${Number(pr.stuff.price).toLocaleString("fa-IR")} تومان`} valueDir="ltr" />
                )}
              </div>
            </SectionCard>
          )}

          {goodsReceipts.length > 0 && (
            <SectionCard icon={Package} title="رسید کالا" iconClassName="bg-teal-500/10 text-teal-400 ring-teal-500/15" badge={<span className="rounded-full bg-white/[0.03] px-2.5 py-1 text-body-sm text-fog ring-1 ring-inset ring-steel-border/25">{goodsReceipts.length.toLocaleString("fa-IR")} رسید</span>}>
              <div className="grid gap-3">
                {goodsReceipts.map((gr) => {
                  const items = (Array.isArray(gr.items) ? gr.items : []) as GoodsReceiptItem[]
                  const totalQty = items.reduce((sum, item) => sum + Number(item.quantityReceived || 0), 0)
                  const receivingUnit = gr.receivingUnit
                  const receivedBy = gr.receivedBy
                  return (
                    <div key={String(gr._id)} className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-body font-medium text-moonlight">
                          {String(gr.receiptNumber || "—")}
                        </span>
                        <StatusBadge status={String(gr.status || "")} />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <MetaItem icon={Package} label="مجموع" value={`${totalQty.toLocaleString("fa-IR")} عدد`} valueDir="ltr" />
                        <MetaItem icon={CalendarDays} label="تاریخ دریافت" value={faDate(gr.receivedAt)} valueDir="ltr" />
                      </div>
                      {(receivingUnit || receivedBy) && (
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
                          {receivingUnit && (
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="size-4 text-fog/60" />
                              واحد دریافت‌کننده: {String(receivingUnit.name || "—")}
                            </span>
                          )}
                          {receivedBy && (
                            <span className="inline-flex items-center gap-1.5">
                              <User className="size-4 text-fog/60" />
                              دریافت‌کننده: {String(receivedBy.first_name || "")} {String(receivedBy.last_name || "")}
                            </span>
                          )}
                        </div>
                      )}
                      {items.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-steel-border/15 pt-3">
                          {items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 text-body-sm">
                              <span className="text-moonlight/80">{String(item.wareModelName || item.wareName || "کالا")}</span>
                              <span className="text-pebble">{Number(item.quantityReceived || 0).toLocaleString("fa-IR")} عدد</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {gr.notes && (
                        <p className="mt-3 rounded-lg border border-steel-border/15 bg-midnight-ink/30 p-2.5 text-body-sm leading-6 text-moonlight/70">
                          {String(gr.notes)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {tenders.length > 0 && (
            <SectionCard icon={Gavel} title="مناقصات" iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15" badge={<span className="rounded-full bg-white/[0.03] px-2.5 py-1 text-body-sm text-fog ring-1 ring-inset ring-steel-border/25">{tenders.length.toLocaleString("fa-IR")} مناقصه</span>}>
              <div className="grid gap-3">
                {tenders.map((tender) => {
                  const tId = String(tender._id || "")
                  const offers = offersByTenderId[tId] || []
                  const tenderStatus = String(tender.status || "")
                  return (
                    <div key={tId} className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-body font-medium text-moonlight">{String(tender.title || "—")}</p>
                          {tender.deadline && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-body-sm text-fog">
                              <CalendarDays className="size-4 text-fog/60" />
                              مهلت: {faDate(tender.deadline)}
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          status={tenderStatus}
                        />
                      </div>
                      {tender.description && (
                        <p className="mt-2 text-body-sm leading-6 text-fog/70">{String(tender.description)}</p>
                      )}
                      {offers.length > 0 && (
                        <div className="mt-4 border-t border-steel-border/15 pt-3">
                          <p className="mb-2 text-caption font-medium text-fog">پیشنهادات</p>
                          <div className="grid gap-2">
                            {offers.map((offer) => {
                              const oId = String(offer._id || "")
                              const isSelected = selectedTenderOfferId === oId
                              const storeName = (offer.store as { name?: string })?.name || "—"
                              return (
                                <div
                                  key={oId}
                                  className={cn(
                                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-steel-border/20 bg-white/[0.02] p-3",
                                    isSelected && "border-cipher-mint/30 bg-cipher-mint/[0.05]"
                                  )}
                                >
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    {isSelected && (
                                      <BadgeCheck className="size-5 shrink-0 text-cipher-mint" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-body-sm font-medium text-moonlight">{storeName}</p>
                                      <p className="mt-0.5 text-body-sm text-fog">
                                        {Number(offer.price || 0).toLocaleString("fa-IR")} تومان
                                        {offer.deliveryTime != null && ` · ${offer.deliveryTime} روز`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge
                                      status={String(offer.status || "")}
                                    />
                                    {isSelected && (
                                      <span className="rounded-md bg-cipher-mint/10 px-2 py-1 text-caption font-medium text-cipher-mint ring-1 ring-inset ring-cipher-mint/20">
                                        انتخاب شده
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {offers.length === 0 && (
                        <p className="mt-3 text-body-sm text-fog/50">هیچ پیشنهادی ثبت نشده است</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {paymentOrders.length > 0 && (
            <SectionCard icon={CreditCard} title="دستورات پرداخت" iconClassName="bg-violet-500/10 text-violet-400 ring-violet-500/15" badge={<span className="rounded-full bg-white/[0.03] px-2.5 py-1 text-body-sm text-fog ring-1 ring-inset ring-steel-border/25">{paymentOrders.length.toLocaleString("fa-IR")} سند</span>}>
              <div className="grid gap-3">
                {paymentOrders.map((po) => (
                  <div key={String(po._id)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-steel-border/20 bg-white/[0.02] p-4">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-moonlight">{String(po.title || "—")}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <StatusBadge status={String(po.status || "")} />
                        {po.paidAt && (
                          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog">
                            <CalendarDays className="size-4 text-fog/60" />
                            پرداخت: {faDate(po.paidAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-white/[0.03] px-3 py-2 text-body font-semibold text-glacier" dir="ltr">
                      {Number(po.amount || 0).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard icon={Zap} title="اقدامات سریع" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
            <div className="space-y-3">
              {isDraft && (
                <SubmitPRButton
                  purchasingRequestId={pr._id}
                  title={pr.title}
                  quantity={pr.quantity}
                  wareModelName={pr.wareModel?.name}
                />
              )}
              {canReceive && (
                <ReceiveGoodsButton
                  purchasingRequestId={pr._id}
                  wareModelId={pr.wareModel._id}
                  quantity={pr.quantity || 1}
                  receivingUnitId={receiveUnitId || ""}
                  receivedById={currentUserId || ""}
                  wareModelName={pr.wareModel?.name}
                />
              )}
              <Link href="/requests/my-requests" className="w-full">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowRight className="size-5" />
                  درخواست‌های من
                </Button>
              </Link>
            </div>
          </SectionCard>

          <SectionCard icon={FileText} title="خلاصه درخواست" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
            <div className="space-y-4">
              <div>
                <p className="text-caption text-fog">وضعیت</p>
                <div className="mt-1.5">
                  <StatusBadge size="lg" status={prStatus} label={statusLabel} />
                </div>
              </div>
              <MetaItem icon={User} label="ثبت‌کننده" value={fullName(pr.requester)} />
              <MetaItem icon={Package} label="تعداد" value={pr.quantity?.toLocaleString("fa-IR") || "—"} valueDir="ltr" />
              <MetaItem icon={Building2} label="واحد درخواست‌کننده" value={pr.requestingUnit?.name || "—"} />
              <MetaItem icon={GitBranch} label="فرآیند" value={pr.process?.name || "—"} />
              <MetaItem icon={CalendarDays} label="تاریخ ثبت" value={faDate(pr.createdAt)} valueDir="ltr" />
              <MetaItem icon={RefreshCw} label="آخرین بروزرسانی" value={faDate(pr.updatedAt)} valueDir="ltr" />
            </div>
          </SectionCard>

          {pr.budgetLine && (
            <SectionCard icon={Landmark} title="خط بودجه" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
              <div className="space-y-4">
                {pr.budgetLine.code && (
                  <MetaItem icon={FileText} label="کد" value={pr.budgetLine.code} valueDir="ltr" />
                )}
                {pr.budgetLine.title && (
                  <MetaItem icon={ClipboardList} label="عنوان" value={pr.budgetLine.title} />
                )}
                {pr.budgetLine.totalAllocated != null && (
                  <MetaItem icon={Coins} label="تخصیص کل" value={`${Number(pr.budgetLine.totalAllocated).toLocaleString("fa-IR")} تومان`} valueDir="ltr" />
                )}
                {pr.budgetLine.totalEncumbered != null && (
                  <MetaItem icon={CreditCard} label="تعهد شده" value={`${Number(pr.budgetLine.totalEncumbered).toLocaleString("fa-IR")} تومان`} valueDir="ltr" />
                )}
                {pr.budgetLine.totalAllocated != null && pr.budgetLine.totalEncumbered != null && (
                  <div className="flex items-center justify-between rounded-xl border border-cipher-mint/25 bg-cipher-mint/[0.05] p-3">
                    <span className="text-body-sm font-medium text-fog">مانده</span>
                    <span className="text-body font-semibold text-cipher-mint" dir="ltr">
                      {Number(pr.budgetLine.totalAllocated - pr.budgetLine.totalEncumbered).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {pr.store && (
            <SectionCard icon={Store} title="فروشگاه / انبار" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
              <div className="space-y-4">
                <p className="text-body font-medium text-moonlight">{pr.store.name}</p>
                {pr.store.address && (
                  <p className="flex items-start gap-1.5 text-body-sm leading-6 text-fog">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-fog/60" />
                    {pr.store.address}
                  </p>
                )}
              </div>
            </SectionCard>
          )}

          {pr.stuffStatus === "received" && (
            <SectionCard icon={BadgeCheck} title="دریافت و تکمیل شده" iconClassName="bg-cipher-mint/10 text-cipher-mint ring-cipher-mint/15">
              <div className="space-y-4">
                {pr.completedAt && (
                  <MetaItem icon={CalendarDays} label="تاریخ تکمیل" value={faDate(pr.completedAt)} valueDir="ltr" />
                )}
                {goodsReceipts.length > 0 && (
                  <div>
                    <MetaItem icon={Package} label="تعداد رسید" value={`${goodsReceipts.length.toLocaleString("fa-IR")} رسید`} valueDir="ltr" />
                    {(() => {
                      const totalReceived = goodsReceipts.reduce((sum, gr) => {
                        const items = (Array.isArray(gr.items) ? gr.items : []) as GoodsReceiptItem[]
                        return sum + items.reduce((s, item) => s + Number(item.quantityReceived || 0), 0)
                      }, 0)
                      return (
                        <p className="mt-2 rounded-lg border border-cipher-mint/20 bg-cipher-mint/[0.05] p-2.5 text-body-sm text-cipher-mint">
                          مجموع کالای دریافت شده: {totalReceived.toLocaleString("fa-IR")} عدد
                        </p>
                      )
                    })()}
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* ── 4. History / Timeline ─────────────────────────────────── */}
      <HistoryTimeline history={pr.history || []} />
    </div>
  )
}
