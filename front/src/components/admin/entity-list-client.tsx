"use client"

import { useCallback, useState } from "react"
import { Fragment } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ArrowDownUp, RotateCcw, Inbox } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { FilterOption } from "@/components/ui/filter-select"

export interface EntityCardProps<T> {
  item: T
  onEdit: (item: T) => void
  onRelations: (item: T) => void
  onDelete: (item: T) => void
}

export interface EntityListFilter {
  key: string
  placeholder: string
  ariaLabel: string
  options: FilterOption[]
  value: string
}

interface EntityListClientProps<T> {
  title: string
  description: string
  addHref: string
  addLabel: string
  searchPlaceholder: string
  basePath: string
  search: string
  sort: string
  defaultSort: string
  sortOptions: FilterOption[]
  extraFilters?: EntityListFilter[]
  items: T[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
  countLabel: (n: number) => string
  emptyIcon?: React.ElementType
  emptyTitle: string
  emptyDescription: string
  renderCard: (props: EntityCardProps<T>) => React.ReactNode
  itemHref?: (item: T) => string
  editHref?: (item: T) => string
  relationsHref?: (item: T) => string
  onDelete: (item: T) => Promise<{ success: boolean; body?: { message?: string } }>
  deleteTitle: string
  deleteDescription: (item: T) => string
  deleteSuccess: string
  deleteError: string
  helpTopicId?: string
  helpTooltip?: string
}

function EntityListClient<T extends { _id: string }>({
  title,
  description,
  addHref,
  addLabel,
  searchPlaceholder,
  basePath,
  search,
  sort,
  defaultSort,
  sortOptions,
  extraFilters = [],
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  countLabel,
  emptyIcon = Inbox,
  emptyTitle,
  emptyDescription,
  renderCard,
  itemHref,
  editHref,
  relationsHref,
  onDelete,
  deleteTitle,
  deleteDescription,
  deleteSuccess,
  deleteError,
  helpTopicId,
  helpTooltip,
}: EntityListClientProps<T>) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  const makeParams = useCallback(
    (next: { search?: string; sort?: string; filterOverrides?: Record<string, string> }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextSort = next.sort ?? sort
      if (nextSearch) params.set("search", nextSearch)
      if (nextSort && nextSort !== defaultSort) params.set("sort", nextSort)
      for (const filter of extraFilters) {
        const value = next.filterOverrides?.[filter.key] ?? filter.value
        if (value) params.set(filter.key, value)
      }
      return params.toString()
    },
    [search, sort, defaultSort, extraFilters],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`${basePath}${qs ? `?${qs}` : ""}`)
    },
    [router, basePath],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? defaultSort }))
  const handleFilterChange = (key: string) => (value: string | null) =>
    go(makeParams({ filterOverrides: { [key]: value ?? "" } }))
  const handleReset = () => router.push(basePath)

  const hasFilters = Boolean(
    search || (sort && sort !== defaultSort) || extraFilters.some((f) => f.value),
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await onDelete(deleteTarget)
      if (result.success) {
        toast.success(deleteSuccess)
        router.refresh()
      } else {
        toast.error(result.body?.message || deleteError)
      }
    } catch {
      toast.error(deleteError)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {countLabel(total)}
        </span>
        <Link href={addHref}>
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            {addLabel}
          </Button>
        </Link>
        {helpTopicId && (
          <HelpLauncher topicId={helpTopicId} tooltip={helpTooltip} />
        )}
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          ariaLabel={searchPlaceholder}
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          {extraFilters.map((filter) => (
            <FilterSelect
              key={filter.key}
              icon={ArrowDownUp}
              placeholder={filter.placeholder}
              ariaLabel={filter.ariaLabel}
              value={filter.value}
              onValueChange={handleFilterChange(filter.key)}
              options={filter.options}
            />
          ))}
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش"
            value={sort}
            onValueChange={handleSort}
            options={sortOptions}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-11 gap-2 rounded-sm px-4 text-body-sm text-moonlight"
            >
              <RotateCcw className="size-5" strokeWidth={2} />
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <Fragment key={item._id}>
              {renderCard({
                item,
                onEdit: () => router.push(editHref ? editHref(item) : itemHref ? itemHref(item) : `${basePath}/${item._id}`),
                onRelations: () => router.push(relationsHref ? relationsHref(item) : `${basePath}/${item._id}/relations`),
                onDelete: setDeleteTarget,
              })}
            </Fragment>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={
            hasFilters
              ? "با تغییر جستجو یا مرتب‌سازی، مورد موردنظر را پیدا کنید."
              : emptyDescription
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href={addHref}>
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  {addLabel}
                </Button>
              </Link>
            )
          }
        />
      )}

      {(prevUrl || nextUrl) && (
        <Pagination
          prevUrl={prevUrl}
          nextUrl={nextUrl}
          page={page}
          totalPages={totalPages}
          className="pt-2 border-t border-steel-border/15"
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={deleteTitle}
        description={deleteTarget ? deleteDescription(deleteTarget) : ""}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

export { EntityListClient }
