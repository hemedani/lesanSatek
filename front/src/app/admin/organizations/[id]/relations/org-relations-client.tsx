"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, MapPin, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { SearchSelect } from "@/components/form/form-search-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { updateRelations } from "@/app/actions/organization/updateRelations"
import { gets as getStates } from "@/app/actions/state/gets"
import { gets as getCities } from "@/app/actions/city/gets"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface OrgRelationsProps {
  org: {
    _id: string
    name?: string
    state?: { _id: string; name?: string }
    city?: { _id: string; name?: string }
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
  removed,
  disabled,
  onRemove,
}: {
  label: string
  description?: string
  value: string
  displayLabel?: string
  onChange: (value: string) => void
  placeholder: string
  fetcher: (search?: string) => Promise<{ _id: string; name: string }[]>
  removed: boolean
  disabled: boolean
  onRemove: () => void
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body-sm font-medium text-moonlight">{label}</p>
          {description && <p className="mt-0.5 text-caption text-fog/60">{description}</p>}
        </div>
        {value && !removed && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="shrink-0 gap-1.5 px-3 text-fog/70 hover:text-ember hover:bg-ember/5"
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        )}
        {removed && (
          <span className="shrink-0 rounded-full bg-ember/10 px-2.5 py-0.5 text-caption font-medium text-ember ring-1 ring-inset ring-ember/20">
            حذف می‌شود
          </span>
        )}
      </div>
      <div className={cn("transition-opacity duration-200", removed && "pointer-events-none opacity-40")}>
        <SearchSelect
          value={removed ? "" : value}
          onChange={onChange}
          placeholder={placeholder}
          fetcher={fetcher}
          label={label}
          disabled={disabled}
          displayLabel={removed ? "" : displayLabel}
        />
      </div>
      <div className="border-b border-steel-border/20" />
    </div>
  )
}

export function OrgRelationsClient({ org }: OrgRelationsProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [stateId, setStateId] = useState(org.state?._id || "")
  const [cityId, setCityId] = useState(org.city?._id || "")
  const [removeState, setRemoveState] = useState(false)
  const [removeCity, setRemoveCity] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<"state" | "city" | null>(null)

  const stateFetcher = async (search?: string) => {
    const result = await getStates(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((s: { _id?: string; name?: string }) => ({
      _id: s._id || "",
      name: s.name || "",
    }))
  }

  const cityFetcher = async (search?: string) => {
    const result = await getCities(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        page: 1,
        limit: 50,
        search: search || undefined,
        ...(stateId && !removeState ? { stateId } : {}),
      } as unknown as ReqType["main"]["city"]["gets"]["set"],
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((c: { _id?: string; name?: string }) => ({
      _id: c._id || "",
      name: c.name || "",
    }))
  }

  const handleRemoveConfirm = () => {
    if (confirmTarget === "state") {
      setStateId("")
      setCityId("")
      setRemoveState(true)
      setRemoveCity(false)
    } else if (confirmTarget === "city") {
      setCityId("")
      setRemoveCity(true)
    }
    setConfirmTarget(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: org._id,
          ...(stateId && !removeState ? { state: stateId } : {}),
          ...(cityId && !removeCity ? { city: cityId } : {}),
          ...(removeState ? { removeState: true } : {}),
          ...(removeCity ? { removeCity: true } : {}),
        },
        { _id: 1, name: 1 },
      )
      if (result.success) {
        toast.success("روابط با موفقیت به‌روزرسانی شد")
        router.push(`/admin/organizations/${org._id}`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی روابط")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی روابط")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={org.name || "ویرایش روابط"}
        description="ویرایش روابط سازمان"
      >
        <Link href={`/admin/organizations/${org._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
      </PageHeader>

      <SectionCard
        icon={MapPin}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="موقعیت مکانی"
        description="استان و شهر مرتبط با سازمان"
      >
        <RelationField
          label="استان"
          description="استان محل فعالیت سازمان"
          value={stateId}
          displayLabel={org.state?.name}
          onChange={(v) => {
            setStateId(v)
            setRemoveState(false)
            if (v) {
              setCityId("")
              setRemoveCity(false)
            }
          }}
          placeholder="انتخاب استان…"
          fetcher={stateFetcher}
          removed={removeState}
          disabled={submitting}
          onRemove={() => setConfirmTarget("state")}
        />

        <RelationField
          label="شهر"
          description="شهر محل فعالیت سازمان"
          value={cityId}
          displayLabel={org.city?.name}
          onChange={(v) => {
            setCityId(v)
            setRemoveCity(false)
          }}
          placeholder="انتخاب شهر…"
          fetcher={cityFetcher}
          removed={removeCity}
          disabled={submitting}
          onRemove={() => setConfirmTarget("city")}
        />
      </SectionCard>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <p className="hidden text-caption text-fog/60 sm:block">
            تغییرات پس از ذخیره روی سازمان اعمال می‌شود
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
              onClick={() => router.push(`/admin/organizations/${org._id}`)}
              className="gap-2 px-5"
            >
              <X className="size-5" />
              انصراف
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null)
        }}
        title={confirmTarget === "state" ? "حذف استان" : "حذف شهر"}
        description="با حذف، مقدار این رابطه خالی می‌شود و پس از ذخیره روی سازمان اعمال خواهد شد."
        confirmLabel="حذف"
        onConfirm={handleRemoveConfirm}
      />
    </div>
  )
}
