"use client"

import { Building2 } from "lucide-react"
import { EntityListClient } from "@/components/admin/entity-list-client"
import { EntityCard } from "@/components/admin/entity-card"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/manufacturer/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface Manufacturer {
  _id: string
  name?: string
  enName?: string
  country?: string
  createdAt?: string
}

interface ManufacturersClientProps {
  items: Manufacturer[]
  countsByManufacturer: Record<string, number>
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
  search: string
  sort: string
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "name-asc", label: "نام" },
  { value: "name-desc", label: "نام معکوس" },
]

export function ManufacturersClient({
  items,
  countsByManufacturer,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
}: ManufacturersClientProps) {
  return (
    <EntityListClient
      title="تولیدکنندگان"
      description="مدیریت تولیدکنندگان کالا"
      addHref="/admin/manufacturers/add"
      addLabel="افزودن تولیدکننده"
      searchPlaceholder="جستجوی تولیدکننده…"
      helpTopicId="admin-manufacturers"
      helpTooltip="راهنمای تولیدکنندگان"
      basePath="/admin/manufacturers"
      search={search}
      sort={sort}
      defaultSort="createdAt-desc"
      sortOptions={sortOptions}
      items={items}
      prevUrl={prevUrl}
      nextUrl={nextUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      countLabel={(n) => `${n.toLocaleString("fa-IR")} تولیدکننده`}
      emptyIcon={Building2}
      emptyTitle="هنوز تولیدکننده‌ای ثبت نشده است"
      emptyDescription="نخستین تولیدکننده را برای ثبت مشخصات کالاها ایجاد کنید."
      renderCard={({ item, onEdit, onDelete }) => (
        <EntityCard
          icon={Building2}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title={item.name || "بدون نام"}
          subtitle={item.enName}
          badge={item.country}
          stats={[{ label: "کالا", value: (countsByManufacturer[item._id] || 0).toLocaleString("fa-IR") }]}
          date={item.createdAt}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      onDelete={(item) => remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })}
      deleteTitle="حذف تولیدکننده"
      deleteDescription={(item) =>
        `آیا از حذف تولیدکننده «${item.name || "این مورد"}» اطمینان دارید؟ در صورت وجود کالای وابسته، حذف انجام نخواهد شد.`
      }
      deleteSuccess="تولیدکننده با موفقیت حذف شد"
      deleteError="خطا در حذف تولیدکننده"
    />
  )
}
