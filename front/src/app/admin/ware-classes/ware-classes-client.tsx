"use client"

import { Layers } from "lucide-react"
import { EntityListClient } from "@/components/admin/entity-list-client"
import { EntityCard } from "@/components/admin/entity-card"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/wareClass/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface WareClass {
  _id: string
  name?: string
  enName?: string
  createdAt?: string
  wareType?: { _id: string; name?: string }
}

interface WareClassesClientProps {
  items: WareClass[]
  wareTypes: { _id: string; name?: string }[]
  countsByClass: Record<string, number>
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
  search: string
  sort: string
  wareTypeId: string
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "name-asc", label: "نام" },
  { value: "name-desc", label: "نام معکوس" },
]

export function WareClassesClient({
  items,
  wareTypes,
  countsByClass,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  wareTypeId,
}: WareClassesClientProps) {
  return (
    <EntityListClient
      title="کلاس‌های کالا"
      description="مدیریت کلاس‌های کالا — سطح دوم سلسله‌مراتب دسته‌بندی"
      addHref="/admin/ware-classes/add"
      addLabel="افزودن کلاس کالا"
      searchPlaceholder="جستجوی کلاس کالا…"
      basePath="/admin/ware-classes"
      search={search}
      sort={sort}
      defaultSort="createdAt-desc"
      sortOptions={sortOptions}
      extraFilters={[
        {
          key: "wareTypeId",
          placeholder: "همه انواع",
          ariaLabel: "فیلتر بر اساس نوع کالا",
          value: wareTypeId,
          options: wareTypes.map((t) => ({ value: t._id, label: t.name || t._id })),
        },
      ]}
      items={items}
      prevUrl={prevUrl}
      nextUrl={nextUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      countLabel={(n) => `${n.toLocaleString("fa-IR")} کلاس کالا`}
      emptyIcon={Layers}
      emptyTitle="هنوز کلاس کالایی ثبت نشده است"
      emptyDescription="نخستین کلاس کالا را برای ادامه سلسله‌مراتب دسته‌بندی ایجاد کنید."
      renderCard={({ item, onEdit, onDelete }) => (
        <EntityCard
          icon={Layers}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title={item.name || "بدون نام"}
          subtitle={item.enName}
          badge={item.wareType?.name}
          stats={[{ label: "کالا", value: (countsByClass[item._id] || 0).toLocaleString("fa-IR") }]}
          date={item.createdAt}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      onDelete={(item) => remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })}
      deleteTitle="حذف کلاس کالا"
      deleteDescription={(item) =>
        `آیا از حذف کلاس کالا «${item.name || "این مورد"}» اطمینان دارید؟ در صورت وجود کالای وابسته، حذف انجام نخواهد شد.`
      }
      deleteSuccess="کلاس کالا با موفقیت حذف شد"
      deleteError="خطا در حذف کلاس کالا"
    />
  )
}
