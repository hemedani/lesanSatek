"use client"

import { Cuboid } from "lucide-react"
import { EntityListClient } from "@/components/admin/entity-list-client"
import { EntityCard } from "@/components/admin/entity-card"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/wareModel/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface WareModel {
  _id: string
  name?: string
  enName?: string
  createdAt?: string
  wareType?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareGroup?: { _id: string; name?: string }
}

interface WareModelsClientProps {
  items: WareModel[]
  wareTypes: { _id: string; name?: string }[]
  countsByModel: Record<string, number>
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

export function WareModelsClient({
  items,
  wareTypes,
  countsByModel,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  wareTypeId,
}: WareModelsClientProps) {
  return (
    <EntityListClient
      title="مدل‌های کالا"
      description="مدیریت مدل‌های کالا — سطح چهارم سلسله‌مراتب دسته‌بندی"
      addHref="/admin/ware-models/add"
      addLabel="افزودن مدل کالا"
      searchPlaceholder="جستجوی مدل کالا…"
      helpTopicId="admin-ware-models"
      helpTooltip="راهنمای مدل‌های کالا"
      basePath="/admin/ware-models"
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
      countLabel={(n) => `${n.toLocaleString("fa-IR")} مدل کالا`}
      emptyIcon={Cuboid}
      emptyTitle="هنوز مدل کالایی ثبت نشده است"
      emptyDescription="نخستین مدل کالا را برای ثبت کالاهای مشخص ایجاد کنید."
      renderCard={({ item, onEdit, onDelete }) => (
        <EntityCard
          icon={Cuboid}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title={item.name || "بدون نام"}
          subtitle={item.enName}
          badge={item.wareType?.name}
          stats={[
            { label: "کالا", value: (countsByModel[item._id] || 0).toLocaleString("fa-IR") },
            { label: "کلاس", value: item.wareClass?.name || "—" },
          ]}
          date={item.createdAt}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      onDelete={(item) => remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })}
      deleteTitle="حذف مدل کالا"
      deleteDescription={(item) =>
        `آیا از حذف مدل کالا «${item.name || "این مورد"}» اطمینان دارید؟ در صورت وجود کالای وابسته، حذف انجام نخواهد شد.`
      }
      deleteSuccess="مدل کالا با موفقیت حذف شد"
      deleteError="خطا در حذف مدل کالا"
    />
  )
}
