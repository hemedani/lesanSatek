import Link from "next/link"
import { Plus, User, ShoppingCart, Warehouse, ScrollText, Activity, Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Button } from "@/components/ui/button"
import { NavCard } from "@/components/dashboard/nav-card"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { count as countPRs } from "@/app/actions/purchasingRequest/count"
import { gets as getProcesses } from "@/app/actions/process/gets"
import type { ReqType } from "@/types/declarations/selectInp"
import { RequestsListClient } from "./requests-client"
import type { PRItem, ProcessOption, RequestCounts } from "./requests-client"

const LIMIT = 12

const VALID_STATUSES: NonNullable<ReqType["main"]["purchasingRequest"]["gets"]["set"]["status"]>[] = [
  "Draft",
  "Pending",
  "InProgress",
  "Approved",
  "PendingFinalization",
  "Rejected",
  "Completed",
  "Cancelled",
]

const PR_PROJECTION = {
  _id: 1,
  title: 1,
  status: 1,
  currentStep: 1,
  quantity: 1,
  estimatedAmount: 1,
  createdAt: 1,
  requester: { _id: 1, first_name: 1, last_name: 1 },
  process: { _id: 1, name: 1, unit: { _id: 1, name: 1 } },
  wareModel: { _id: 1, name: 1 },
} as const

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const status =
    typeof resolvedSearchParams.status === "string" &&
    (VALID_STATUSES as readonly string[]).includes(resolvedSearchParams.status)
      ? (resolvedSearchParams.status as NonNullable<ReqType["main"]["purchasingRequest"]["gets"]["set"]["status"]>)
      : ""
  const processId = typeof resolvedSearchParams.processId === "string" ? resolvedSearchParams.processId : ""
  const sort: "asc" | "desc" = resolvedSearchParams.sort === "asc" ? "asc" : "desc"

  const listSet = {
    page,
    limit: LIMIT,
    sortBy: "createdAt" as const,
    sortOrder: sort,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(processId ? { processId } : {}),
  }
  const countSet = {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(processId ? { processId } : {}),
  }

  const [
    prsResult,
    processesResult,
    filteredCountResult,
    totalCountResult,
    draftCountResult,
    pendingCountResult,
    inProgressCountResult,
    approvedCountResult,
    rejectedCountResult,
    cancelledCountResult,
  ] = await Promise.all([
    getPRs(listSet, PR_PROJECTION),
    getProcesses({ page: 1, limit: 200 }, { _id: 1, name: 1, status: 1 }),
    countPRs(countSet, { qty: 1 }),
    countPRs({}, { qty: 1 }),
    countPRs({ status: "Draft" }, { qty: 1 }),
    countPRs({ status: "Pending" }, { qty: 1 }),
    countPRs({ status: "InProgress" }, { qty: 1 }),
    countPRs({ status: "Approved" }, { qty: 1 }),
    countPRs({ status: "Rejected" }, { qty: 1 }),
    countPRs({ status: "Cancelled" }, { qty: 1 }),
  ])

  const items = (prsResult.success ? prsResult.body || [] : []) as PRItem[]
  const processes = (processesResult.success ? processesResult.body || [] : []) as ProcessOption[]
  const activeProcesses = processes.filter((p) => p?.status !== "deactivated")
  const filteredTotal = filteredCountResult.success ? (filteredCountResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / LIMIT))

  const counts: RequestCounts = {
    total: totalCountResult.success ? (totalCountResult.body?.qty ?? 0) : 0,
    draft: draftCountResult.success ? (draftCountResult.body?.qty ?? 0) : 0,
    pending:
      (pendingCountResult.success ? (pendingCountResult.body?.qty ?? 0) : 0) +
      (inProgressCountResult.success ? (inProgressCountResult.body?.qty ?? 0) : 0),
    approved: approvedCountResult.success ? (approvedCountResult.body?.qty ?? 0) : 0,
    rejected:
      (rejectedCountResult.success ? (rejectedCountResult.body?.qty ?? 0) : 0) +
      (cancelledCountResult.success ? (cancelledCountResult.body?.qty ?? 0) : 0),
  }

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (processId) params.set("processId", processId)
  if (sort === "asc") params.set("sort", "asc")
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/requests?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/requests?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="درخواست‌های خرید"
        description="ثبت، پیگیری و مدیریت درخواست‌های خرید خود در سازمان"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/requests/my-requests">
            <Button variant="ghost" className="gap-2 px-4">
              <User className="size-5" />
              درخواست‌های من
            </Button>
          </Link>
          <Link href="/requests/new">
            <Button className="gap-2 px-5">
              <Plus className="size-5" />
              ثبت درخواست جدید
            </Button>
          </Link>
        </div>
        <HelpLauncher topicId="requests-dashboard" tooltip="راهنمای مرکز درخواست‌ها" />
      </PageHeader>

      <section className="space-y-4" aria-label="دسترسی سریع">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          <NavCard
            href="/requests/my-requests"
            title="درخواست‌های من"
            description="همه درخواست‌های ثبت‌شده من"
            value={counts.total}
            icon={ShoppingCart}
            iconColor="text-electric-iris"
            iconBg="bg-electric-iris/10"
          />
          <NavCard
            href="/requests/inventory"
            title="انبار واحد"
            description="مشاهده موجودی کالا"
            icon={Warehouse}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
          />
          <NavCard
            href="/requests/consumption"
            title="مصرف کالا"
            description="ثبت و مشاهده مصرف"
            icon={ScrollText}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
          />
          <NavCard
            href="/requests/stock-movements"
            title="گردش کالا"
            description="تاریخچه جابه‌جایی کالا"
            icon={Activity}
            iconColor="text-sky-400"
            iconBg="bg-sky-400/10"
          />
          <NavCard
            href="/requests/goods-receipt"
            title="دریافت کالا"
            description="دریافت کالاهای آماده تحویل"
            icon={Package}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
          />
        </div>
      </section>

      <RequestsListClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
        processId={processId}
        sort={sort}
        processes={activeProcesses}
        counts={counts}
      />
    </div>
  )
}
