"use client"

import { Package } from "lucide-react"
import { EntityListClient } from "@/components/admin/entity-list-client"
import { EntityCard } from "@/components/admin/entity-card"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/ware/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface Ware {
  _id: string
  name?: string
  enName?: string
  brand?: string
  price?: number
  orderedNumber?: number
  irc?: string
  umdns?: number
  gtin?: number
  createdAt?: string
  wareType?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareGroup?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  manufacturer?: { _id: string; name?: string }
}

interface WaresClientProps {
  items: Ware[]
  wareTypes: { _id: string; name?: string }[]
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
  { value: "price-desc", label: "گران‌ترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
]

export function WaresClient({
  items,
  wareTypes,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  wareTypeId,
}: WaresClientProps) {
  return (
    <EntityListClient
      title="کالاها"
      description="مدیریت کالاهای مشخص — گره‌های پایانی سلسله‌مراتب دسته‌بندی"
      addHref="/admin/wares/add"
      addLabel="افزودن کالا"
      searchPlaceholder="جستجوی کالا…"
      helpTopicId="admin-wares"
      helpTooltip="راهنمای کالاها"
      basePath="/admin/wares"
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
      countLabel={(n) => `${n.toLocaleString("fa-IR")} کالا`}
      emptyIcon={Package}
      emptyTitle="هنوز کالایی ثبت نشده است"
      emptyDescription="نخستین کالا را با انتخاب مدل و تولیدکننده ایجاد کنید."
      itemHref={(item) => `/admin/wares/${item._id}`}
      editHref={(item) => `/admin/wares/${item._id}/edit`}
      renderCard={({ item, onEdit, onRelations, onDelete }) => (
        <EntityCard
          icon={Package}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title={item.name || "بدون نام"}
          titleHref={`/admin/wares/${item._id}`}
          subtitle={item.enName}
          badge={item.manufacturer?.name}
          stats={[
            {
              label: "قیمت",
              value: item.price != null ? `${item.price.toLocaleString("fa-IR")}` : "—",
            },
            { label: "مدل", value: item.wareModel?.name || "—" },
            { label: "نوع", value: item.wareType?.name || "—" },
          ]}
          date={item.createdAt}
          onEdit={() => onEdit(item)}
          onRelations={() => onRelations(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      onDelete={(item) => remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })}
      deleteTitle="حذف کالا"
      deleteDescription={(item) =>
        `آیا از حذف کالا «${item.name || "این مورد"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`
      }
      deleteSuccess="کالا با موفقیت حذف شد"
      deleteError="خطا در حذف کالا"
    />
  )
}
