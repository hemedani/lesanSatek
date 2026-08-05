"use client"

import { Grid3X3 } from "lucide-react"
import { EntityListClient } from "@/components/admin/entity-list-client"
import { EntityCard } from "@/components/admin/entity-card"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/wareGroup/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface WareGroup {
  _id: string
  name?: string
  enName?: string
  createdAt?: string
  wareType?: { _id: string; name?: string }
  wareClasses?: { _id: string; name?: string }[]
}

interface WareGroupsClientProps {
  items: WareGroup[]
  wareTypes: { _id: string; name?: string }[]
  countsByGroup: Record<string, number>
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

export function WareGroupsClient({
  items,
  wareTypes,
  countsByGroup,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  wareTypeId,
}: WareGroupsClientProps) {
  return (
    <EntityListClient
      title="گروه‌های کالا"
      description="مدیریت گروه‌های کالا — سطح سوم سلسله‌مراتب دسته‌بندی"
      addHref="/admin/ware-groups/add"
      addLabel="افزودن گروه کالا"
      searchPlaceholder="جستجوی گروه کالا…"
      helpTopicId="admin-ware-groups"
      helpTooltip="راهنمای گروه‌های کالا"
      basePath="/admin/ware-groups"
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
      countLabel={(n) => `${n.toLocaleString("fa-IR")} گروه کالا`}
      emptyIcon={Grid3X3}
      emptyTitle="هنوز گروه کالایی ثبت نشده است"
      emptyDescription="نخستین گروه کالا را برای ادامه سلسله‌مراتب دسته‌بندی ایجاد کنید."
      renderCard={({ item, onEdit, onRelations, onDelete }) => (
        <EntityCard
          icon={Grid3X3}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title={item.name || "بدون نام"}
          subtitle={item.enName}
          badge={item.wareType?.name}
          stats={[
            { label: "کالا", value: (countsByGroup[item._id] || 0).toLocaleString("fa-IR") },
            { label: "رده‌ها", value: (item.wareClasses?.length || 0).toLocaleString("fa-IR") },
          ]}
          date={item.createdAt}
          onEdit={() => onEdit(item)}
          onRelations={() => onRelations(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      onDelete={(item) => remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })}
      deleteTitle="حذف گروه کالا"
      deleteDescription={(item) =>
        `آیا از حذف گروه کالا «${item.name || "این مورد"}» اطمینان دارید؟ در صورت وجود کالای وابسته، حذف انجام نخواهد شد.`
      }
      deleteSuccess="گروه کالا با موفقیت حذف شد"
      deleteError="خطا در حذف گروه کالا"
    />
  )
}
