"use client"

import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"

const offerStatusMap: Record<string, string> = {
  pending: "در انتظار بررسی",
  accepted: "پذیرفته شده",
  rejected: "رد شده",
  awarded: "برنده",
}

interface OfferItem {
  _id: string
  price?: number
  status?: string
  deliveryTime?: string
  createdAt?: string
  tender?: { _id: string; title?: string }
}

const columns: Column<OfferItem>[] = [
  {
    key: "tender",
    label: "مناقصه",
    render: (item) => item.tender?.title || "—",
  },
  {
    key: "price",
    label: "قیمت پیشنهادی",
    render: (item) => `${(item.price || 0).toLocaleString("fa-IR")} تومان`,
  },
  { key: "deliveryTime", label: "زمان تحویل", render: (item) => item.deliveryTime || "—" },
  {
    key: "status",
    label: "وضعیت",
    render: (item) => <StatusBadge status={item.status || "pending"} label={offerStatusMap[item.status || "pending"]} />,
  },
  {
    key: "createdAt",
    label: "تاریخ ثبت",
    render: (item) =>
      item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—",
  },
]

interface MyOffersClientProps {
  items: OfferItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
}

export function MyOffersClient({ items, prevPageUrl, nextPageUrl, page }: MyOffersClientProps) {
  return (
    <>
      <DataTable columns={columns} data={items} keyExtractor={(item) => item._id} />
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </>
  )
}
