"use client"

import { FolderTree } from "lucide-react"
import { EntityListClient } from "@/components/admin/entity-list-client"
import { EntityCard } from "@/components/admin/entity-card"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/wareType/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface WareType {
  _id: string
  name?: string
  enName?: string
  createdAt?: string
}

interface WareTypesClientProps {
  items: WareType[]
  countsByType: Record<string, number>
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

export function WareTypesClient({
  items,
  countsByType,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
}: WareTypesClientProps) {
  return (
    <EntityListClient
      title="انواع کالا"
      description="مدیریت انواع کالا — بالاترین سطح سلسله‌مراتب دسته‌بندی"
      addHref="/admin/ware-types/add"
      addLabel="افزودن نوع کالا"
      searchPlaceholder="جستجوی نوع کالا…"
      basePath="/admin/ware-types"
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
      countLabel={(n) => `${n.toLocaleString("fa-IR")} نوع کالا`}
      emptyIcon={FolderTree}
      emptyTitle="هنوز نوع کالایی ثبت نشده است"
      emptyDescription="نخستین نوع کالا را برای آغاز سلسله‌مراتب دسته‌بندی ایجاد کنید."
      renderCard={({ item, onEdit, onDelete }) => (
        <EntityCard
          icon={FolderTree}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title={item.name || "بدون نام"}
          subtitle={item.enName}
          stats={[{ label: "کالا", value: (countsByType[item._id] || 0).toLocaleString("fa-IR") }]}
          date={item.createdAt}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      onDelete={(item) => remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })}
      deleteTitle="حذف نوع کالا"
      deleteDescription={(item) =>
        `آیا از حذف نوع کالا «${item.name || "این مورد"}» اطمینان دارید؟ در صورت وجود کالای وابسته، حذف انجام نخواهد شد.`
      }
      deleteSuccess="نوع کالا با موفقیت حذف شد"
      deleteError="خطا در حذف نوع کالا"
    />
  )
}
