"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const routeLabels: Record<string, string> = {
  admin: "پنل مدیریت",
  organizations: "سازمان‌ها",
  users: "کاربران",
  units: "واحدها",
  tags: "برچسب‌ها",
  processes: "فرآیندها",
  "purchasing-requests": "درخواست‌های خرید",
  tenders: "مناقصات",
  "goods-receipts": "رسید کالا",
  "payment-orders": "سفارشات پرداخت",
  "ware-types": "انواع کالا",
  "ware-classes": "کلاس کالا",
  "ware-groups": "گروه کالا",
  "ware-models": "مدل کالا",
  wares: "کالاها",
  stores: "انبارها",
  stuff: "موجودی",
  consumption: "مصرف",
  "fiscal-years": "سال‌های مالی",
  "budget-lines": "ره‌بودجه",
  "budget-reports": "گزارش بودجه",
  dashboard: "داشبورد",
  add: "افزودن",
}

function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = routeLabels[segment] || segment
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className={cn("flex items-center gap-1.5 text-sm sm:text-base", className)}>
      {crumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center">
          {!crumb.isLast ? (
            <Link
              href={crumb.href}
              className="flex items-center rounded-md px-2.5 py-1.5 text-fog hover:text-moonlight hover:bg-white/[0.04] transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="flex items-center px-2.5 py-1.5 text-moonlight font-medium">
              {crumb.label}
            </span>
          )}
          {!crumb.isLast && (
            <ChevronLeft className="size-4 text-fog/60 rtl:rotate-180 shrink-0" />
          )}
        </div>
      ))}
    </nav>
  )
}

export { Breadcrumbs }
