"use client"

import { Store } from "lucide-react"
import { EntityListClient } from "@/components/admin/entity-list-client"
import { EntityCard } from "@/components/admin/entity-card"
import { StatusBadge } from "@/components/ui/status-badge"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/store/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface Store {
  _id: string
  name?: string
  status?: string
  score?: number
  address?: string
  ceoname?: string
  storeType?: string
  createdAt?: string
  storeHead?: { _id: string; first_name?: string; last_name?: string }
  city?: { _id: string; name?: string }
  state?: { _id: string; name?: string }
}

interface StoresClientProps {
  items: Store[]
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

const STATUS_MAP: Record<string, { badge: string; label: string }> = {
  Active: { badge: "active", label: "فعال" },
  Inactive: { badge: "inactive", label: "غیرفعال" },
  Suspended: { badge: "pending", label: "تعلیق شده" },
  Blacklisted: { badge: "rejected", label: "مسدود" },
}

function storeHeadName(item: Store): string {
  if (!item.storeHead) return "—"
  return [item.storeHead.first_name, item.storeHead.last_name].filter(Boolean).join(" ") || "—"
}

export function StoresClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
}: StoresClientProps) {
  return (
    <EntityListClient
      title="مدیریت فروشگاه‌ها"
      description="مدیریت فروشگاه‌ها و مسئول هر فروشگاه — سلسله‌مراتب و وضعیت"
      addHref="/admin/stores/add"
      addLabel="افزودن فروشگاه"
      searchPlaceholder="جستجو بر اساس نام فروشگاه…"
      basePath="/admin/stores"
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
      countLabel={(n) => `${n.toLocaleString("fa-IR")} فروشگاه`}
      emptyIcon={Store}
      emptyTitle="هنوز فروشگاهی تعریف نشده است"
      emptyDescription="نخستین فروشگاه را برای ساماندهی تأمین کالا ایجاد کنید."
      relationsHref={(item) => `/admin/stores/${item._id}/relations`}
      renderCard={({ item, onEdit, onRelations, onDelete }) => (
        <EntityCard
          icon={Store}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title={item.name || "بدون نام"}
          subtitle={item.address || item.ceoname}
          stats={[
            { label: "مسئول", value: storeHeadName(item) },
            { label: "شهر", value: item.city?.name || "—" },
            { label: "استان", value: item.state?.name || "—" },
          ]}
          date={item.createdAt}
          onEdit={() => onEdit(item)}
          onRelations={() => onRelations(item)}
          onDelete={() => onDelete(item)}
        >
          <div className="flex items-center gap-2">
            <StatusBadge
              status={STATUS_MAP[item.status || ""]?.badge || "pending"}
              label={STATUS_MAP[item.status || ""]?.label || "در انتظار تأیید"}
              size="sm"
            />
            {item.storeType && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs text-fog">
                {item.storeType}
              </span>
            )}
          </div>
        </EntityCard>
      )}
      onDelete={(item) => remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })}
      deleteTitle="حذف فروشگاه"
      deleteDescription={(item) =>
        `آیا از حذف فروشگاه «${item.name || "این فروشگاه"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`
      }
      deleteSuccess="فروشگاه با موفقیت حذف شد"
      deleteError="خطا در حذف فروشگاه"
    />
  )
}
