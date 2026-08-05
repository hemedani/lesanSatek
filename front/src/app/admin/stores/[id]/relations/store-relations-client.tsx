"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, MapPin, Boxes, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SearchSelect } from "@/components/form/form-search-select"
import { SearchMultiSelect } from "@/components/form/form-search-multi-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { updateRelations } from "@/app/actions/store/updateRelations"
import { gets as getStates } from "@/app/actions/state/gets"
import { gets as getCities } from "@/app/actions/city/gets"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { getUsers } from "@/app/actions/user/getUsers"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface StoreRelationsProps {
  store: {
    _id: string
    name?: string
    storeHead?: { _id: string; first_name?: string; last_name?: string }
    city?: { _id: string; name?: string }
    state?: { _id: string; name?: string }
    wareTypes?: { _id: string; name?: string }[]
  }
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card variant="glass" className="[--card-spacing:--spacing(6)]">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
            {description && <p className="mt-1 text-caption text-fog/70">{description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

function RelationField({
  label,
  description,
  value,
  displayLabel,
  onChange,
  placeholder,
  fetcher,
  disabled,
}: {
  label: string
  description?: string
  value: string
  displayLabel?: string
  onChange: (value: string) => void
  placeholder: string
  fetcher: (search?: string) => Promise<SearchSelectOption[]>
  disabled: boolean
}) {
  return (
    <div className="space-y-2.5">
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-moonlight">{label}</p>
        {description && <p className="mt-0.5 text-caption text-fog/60">{description}</p>}
      </div>
      <SearchSelect
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        fetcher={fetcher}
        label={label}
        disabled={disabled}
        displayLabel={displayLabel}
      />
      <div className="border-b border-steel-border/20" />
    </div>
  )
}

export function StoreRelationsClient({ store }: StoreRelationsProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [storeHeadId, setStoreHeadId] = useState(store.storeHead?._id || "")
  const [cityId, setCityId] = useState(store.city?._id || "")
  const [stateId, setStateId] = useState(store.state?._id || "")
  const [wareTypeIds, setWareTypeIds] = useState<string[]>(
    (store.wareTypes || []).map((w) => w._id)
  )
  const [nameMap, setNameMap] = useState<Record<string, string>>(
    Object.fromEntries((store.wareTypes || []).map((w) => [w._id, w.name || ""]))
  )

  const storeHeadFetcher = async (search?: string) => {
    const result = await getUsers(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, first_name: 1, last_name: 1 }
    )
    if (!result.success || !result.body) return []
    return (result.body as { _id?: string; first_name?: string; last_name?: string }[]).map((u) => ({
      _id: u._id || "",
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || "—",
    }))
  }

  const stateFetcher = async (search?: string) => {
    const result = await getStates(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 }
    )
    if (!result.success || !result.body) return []
    return (result.body as { _id?: string; name?: string }[]).map((s) => ({
      _id: s._id || "",
      name: s.name || "",
    }))
  }

  const cityFetcher = async (search?: string) => {
    const result = await getCities(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 }
    )
    if (!result.success || !result.body) return []
    return (result.body as { _id?: string; name?: string }[]).map((c) => ({
      _id: c._id || "",
      name: c.name || "",
    }))
  }

  const wareTypeFetcher = async (search?: string) => {
    const result = await getWareTypes(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 }
    )
    if (!result.success || !result.body) return []
    return (result.body as { _id?: string; name?: string }[]).map((t) => ({
      _id: t._id || "",
      name: t.name || "",
    }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: store._id,
          ...(storeHeadId ? { storeHeadId } : {}),
          ...(cityId ? { cityId } : {}),
          ...(stateId ? { stateId } : {}),
          ...(wareTypeIds.length ? { wareTypeIds } : {}),
        },
        { _id: 1, name: 1 }
      )

      if (!result.success) {
        toast.error(result.body?.message || "خطا در به‌روزرسانی روابط")
        return
      }

      toast.success("روابط با موفقیت به‌روزرسانی شد")
      router.refresh()
    } catch {
      toast.error("خطا در به‌روزرسانی روابط")
    } finally {
      setSubmitting(false)
    }
  }

  const originalHeadName = store.storeHead
    ? [store.storeHead.first_name, store.storeHead.last_name].filter(Boolean).join(" ")
    : ""

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title={store.name || "ویرایش روابط"} description="ویرایش روابط فروشگاه">
        <Link href={`/admin/stores/${store._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
      <HelpLauncher topicId="admin-stores" tooltip="راهنمای روابط فروشگاه" />
      </PageHeader>

      <SectionCard
        icon={User}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="مسئول فروشگاه"
        description="کاربر مسئول این فروشگاه"
      >
        <RelationField
          label="مسئول فروشگاه"
          description="با انتخاب کاربر، نقش StoreHead به‌روزرسانی می‌شود"
          value={storeHeadId}
          displayLabel={originalHeadName}
          onChange={setStoreHeadId}
          placeholder="انتخاب مسئول…"
          fetcher={storeHeadFetcher}
          disabled={submitting}
        />
      </SectionCard>

      <SectionCard
        icon={MapPin}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="موقعیت"
        description="استان و شهر محل فروشگاه"
      >
        <RelationField
          label="استان"
          value={stateId}
          displayLabel={store.state?.name}
          onChange={setStateId}
          placeholder="انتخاب استان…"
          fetcher={stateFetcher}
          disabled={submitting}
        />
        <RelationField
          label="شهر"
          value={cityId}
          displayLabel={store.city?.name}
          onChange={setCityId}
          placeholder="انتخاب شهر…"
          fetcher={cityFetcher}
          disabled={submitting}
        />
      </SectionCard>

      <SectionCard
        icon={Boxes}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="انواع کالا"
        description="انواع کالایی که فروشگاه می‌تواند تأمین کند"
      >
        <div className="space-y-2.5">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-moonlight">انواع کالا</p>
            <p className="mt-0.5 text-caption text-fog/60">
              انتخاب چند نوع کالا مجاز است
            </p>
          </div>
          <SearchMultiSelect
            value={wareTypeIds}
            onChange={setWareTypeIds}
            placeholder="انتخاب انواع کالا…"
            fetcher={wareTypeFetcher}
            label="انواع کالا"
            disabled={submitting}
            nameMap={nameMap}
            onSelectData={(option: SearchSelectOption) =>
              setNameMap((prev) => ({ ...prev, [option._id]: option.name }))
            }
          />
          <div className="border-b border-steel-border/20" />
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <p className="hidden text-caption text-fog/60 sm:block">
            تغییرات پس از ذخیره روی فروشگاه اعمال می‌شود
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              type="button"
              size="lg"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 gap-2 px-5 sm:flex-none"
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Check className="size-5" />
              )}
              ذخیره روابط
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={submitting}
              onClick={() => router.push(`/admin/stores/${store._id}`)}
              className="gap-2 px-5"
            >
              <X className="size-5" />
              انصراف
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
