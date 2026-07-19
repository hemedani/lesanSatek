"use client"

import Link from "next/link"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"

interface StuffItem {
  _id: string
  quantity?: number
  price?: number
  expiration?: string
  barcode?: number
  createdAt?: string
  ware?: { _id?: string; name?: string }
}

const columns: Column<StuffItem>[] = [
  {
    key: "ware",
    label: "کالا",
    render: (item) => <span className="text-fog text-sm">{item.ware?.name || "—"}</span>,
  },
  {
    key: "quantity",
    label: "تعداد",
    render: (item) => (
      <span className="text-moonlight font-medium font-mono text-sm" dir="ltr">
        {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
      </span>
    ),
  },
  {
    key: "price",
    label: "قیمت (ریال)",
    render: (item) => (
      <span className="text-fog text-sm font-mono" dir="ltr">
        {item.price != null ? item.price.toLocaleString("fa-IR") : "—"}
      </span>
    ),
  },
  {
    key: "expiration",
    label: "انقضا",
    render: (item) => (
      <span className="text-fog text-sm">
        {item.expiration ? new Date(item.expiration).toLocaleDateString("fa-IR") : "—"}
      </span>
    ),
    hideOnCard: true,
  },
  {
    key: "createdAt",
    label: "تاریخ ایجاد",
    render: (item) => (
      <span className="text-fog text-sm">
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
      </span>
    ),
    hideOnCard: true,
  },
  {
    key: "actions",
    label: "",
    render: (item) => (
      <div className="flex items-center gap-1">
        <Link href={`/storehead/stuff/${item._id}`}>
          <Button variant="ghost" size="icon-xs">
            <Pencil className="size-3.5" />
          </Button>
        </Link>
      </div>
    ),
  },
]

interface StuffListClientProps {
  items: StuffItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  search: string
}

export function StuffListClient({ items, prevPageUrl, nextPageUrl, page, search }: StuffListClientProps) {
  return (
    <>
      <div className="relative z-[1]">
        <DataTable columns={columns} data={items} keyExtractor={(item) => item._id} />
      </div>
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </>
  )
}
