"use client"

import Link from "next/link"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"

interface PRItem {
  _id: string
  title?: string
  status?: string
  quantity?: number
  estimatedAmount?: number
  createdAt?: string
}

const columns: Column<PRItem>[] = [
  {
    key: "title",
    label: "عنوان",
    render: (item) => (
      <Link href={`/storehead/purchasing-requests/${item._id}`}>
        <span className="text-moonlight font-medium hover:text-frost-link transition-colors">
          {item.title || "—"}
        </span>
      </Link>
    ),
  },
  {
    key: "status",
    label: "وضعیت",
    render: (item) => <RequestStatusBadge status={item.status} />,
  },
  {
    key: "quantity",
    label: "تعداد",
    render: (item) =>
      item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—",
  },
  {
    key: "estimatedAmount",
    label: "مبلغ برآوردی",
    render: (item) =>
      item.estimatedAmount != null
        ? `${item.estimatedAmount.toLocaleString("fa-IR")} ریال`
        : "—",
  },
  {
    key: "createdAt",
    label: "تاریخ ایجاد",
    render: (item) =>
      item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—",
    hideOnCard: true,
  },
]

interface PRListClientProps {
  items: PRItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
}

export function PRListClient({ items, prevPageUrl, nextPageUrl, page }: PRListClientProps) {
  return (
    <>
      <DataTable columns={columns} data={items} keyExtractor={(item) => item._id} />
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </>
  )
}
