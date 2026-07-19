"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"

const tenderStatusMap: Record<string, string> = {
  open: "باز",
  closed: "بسته شده",
  awarded: "اعطا شده",
  cancelled: "لغو شده",
}

interface TenderItem {
  _id: string
  title?: string
  deadline?: string
  status?: string
  purchasingRequest?: { _id: string; title?: string }
}

const columns: Column<TenderItem>[] = [
  {
    key: "title",
    label: "عنوان",
    render: (item) => (
      <span className="text-moonlight font-medium">{item.title || "—"}</span>
    ),
  },
  {
    key: "purchasingRequest",
    label: "درخواست خرید",
    render: (item) => item.purchasingRequest?.title || "—",
  },
  {
    key: "deadline",
    label: "مهلت",
    render: (item) =>
      item.deadline ? new Date(item.deadline).toLocaleDateString("fa-IR") : "—",
  },
  {
    key: "status",
    label: "وضعیت",
    render: (item) => <StatusBadge status={item.status || "open"} label={tenderStatusMap[item.status || "open"]} />,
  },
  {
    key: "actions",
    label: "عملیات",
    render: (item) =>
      item.status === "open" ? (
        <Link href={`/storehead/tenders/${item._id}/offer`}>
          <Button variant="outline" size="sm">
            ثبت پیشنهاد
          </Button>
        </Link>
      ) : (
        <span className="text-xs text-fog">—</span>
      ),
  },
]

interface TendersListClientProps {
  items: TenderItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
}

export function TendersListClient({ items, prevPageUrl, nextPageUrl, page }: TendersListClientProps) {
  return (
    <>
      <DataTable columns={columns} data={items} keyExtractor={(item) => item._id} />
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </>
  )
}
