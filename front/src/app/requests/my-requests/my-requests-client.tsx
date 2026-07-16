"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

const statusMap: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
}

interface PRItem {
  _id: string
  title?: string
  estimatedAmount?: number
  quantity?: number
  status?: string
  currentStep?: string
  createdAt?: string
}

const columns = [
  {
    key: "title",
    label: "عنوان",
    render: (item: PRItem) => (
      <Link href={`/requests/${item._id}`} className="text-frost-link hover:underline font-medium">
        {item.title || "—"}
      </Link>
    ),
  },
  {
    key: "estimatedAmount",
    label: "مبلغ تخمینی",
    render: (item: PRItem) => `${item.estimatedAmount?.toLocaleString("fa-IR") || "—"} تومان`,
  },
  {
    key: "quantity",
    label: "تعداد",
    render: (item: PRItem) => item.quantity?.toLocaleString("fa-IR") || "—",
  },
  {
    key: "status",
    label: "وضعیت",
    render: (item: PRItem) => <StatusBadge status={item.status || "draft"} labelMap={statusMap} />,
  },
  { key: "currentStep", label: "مرحله", render: (item: PRItem) => item.currentStep || "—" },
  {
    key: "createdAt",
    label: "تاریخ",
    render: (item: PRItem) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"),
  },
]

interface MyRequestsClientProps {
  items: PRItem[]
  prevUrl: string
  nextUrl: string
  page: number
}

function MyRequestsClient({ items, prevUrl, nextUrl, page }: MyRequestsClientProps) {
  if (items.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="py-12">
          <EmptyState
            icon={ShoppingCart}
            title="درخواستی یافت نشد"
            description="شما هنوز هیچ درخواست خریدی ثبت نکرده‌اید"
            action={
              <Link href="/requests/new">
                <Button variant="default">ثبت درخواست جدید</Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-fog">
            {items.length} درخواست
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(item: PRItem) => item._id}
          />
        </CardContent>
      </Card>

      <Pagination
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        page={page}
      />
    </>
  )
}

export { MyRequestsClient }
