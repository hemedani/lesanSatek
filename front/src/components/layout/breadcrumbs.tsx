"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const routeLabels: Record<string, string> = {
  // Admin
  admin: "پنل مدیریت",
  organizations: "سازمان‌ها",
  users: "کاربران",
  units: "واحدها",
  tags: "برچسب‌ها",
  processes: "فرآیندها",
  "purchasing-requests": "درخواست‌های خرید",
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
  "org-chart": "نمودار سازمان",
  settings: "تنظیمات",
  "fiscal-years": "سال‌های مالی",
  "budget-lines": "ره‌بودجه",
  "budget-reports": "گزارش بودجه",
  dashboard: "داشبورد",
  add: "افزودن",

  // Non-admin panels
  orghead: "داشبورد سازمان",
  storehead: "پنل فروشگاه",
  "unit-head": "پنل واحد",
  requests: "درخواست‌ها",
  ordinary: "پیش‌خوان",
  vendor: "فروشندگان",
  finance: "مالی",

  // Shared sub-routes
  tenders: "مناقصات",
  "my-offers": "پیشنهادهای من",
  "my-requests": "درخواست‌های من",
  store: "فروشگاه",
  inventory: "موجودی",
  "stock-movements": "گردش کالا",
  new: "جدید",
  offers: "پیشنهادها",
  show: "مشاهده",
}

function isObjectId(segment: string): boolean {
  return /^[a-f0-9]{24}$/i.test(segment)
}

function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    let label = routeLabels[segment]
    if (!label && isObjectId(segment)) {
      label = "جزئیات"
    }
    if (!label) {
      label = segment
    }
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className={cn("flex items-center gap-1 text-xs sm:text-sm", className)}>
      {crumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center">
          {!crumb.isLast ? (
            <Link
              href={crumb.href}
              className="flex items-center rounded-md px-1.5 sm:px-2 py-1 text-fog hover:text-moonlight hover:bg-white/[0.04] transition-colors whitespace-nowrap"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="flex items-center px-1.5 sm:px-2 py-1 text-moonlight font-medium whitespace-nowrap">
              {crumb.label}
            </span>
          )}
          {!crumb.isLast && (
            <ChevronLeft className="size-3.5 sm:size-4 text-fog/60 rtl:rotate-180 shrink-0" />
          )}
        </div>
      ))}
    </nav>
  )
}

export { Breadcrumbs }
