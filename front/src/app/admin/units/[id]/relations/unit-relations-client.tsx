"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, GitBranch, User, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { SearchSelect } from "@/components/form/form-search-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { updateRelations } from "@/app/actions/unit/updateRelations"
import { addOrRemoveRoles } from "@/app/actions/user/addOrRemoveRoles"
import { gets as getOrgs } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getUsers } from "@/app/actions/user/getUsers"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface UnitRelationsProps {
  unit: {
    _id: string
    name?: string
    organization?: { _id: string; name?: string }
    parentUnit?: { _id: string; name?: string }
    head?: { _id: string; first_name?: string; last_name?: string }
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
  fetcher: (search?: string) => Promise<{ _id: string; name: string }[]>
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

export function UnitRelationsClient({ unit }: UnitRelationsProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [orgId, setOrgId] = useState(unit.organization?._id || "")
  const [parentUnitId, setParentUnitId] = useState(unit.parentUnit?._id || "")
  const [headId, setHeadId] = useState(unit.head?._id || "")
  const [removeHead, setRemoveHead] = useState(false)
  const [confirmRemoveHead, setConfirmRemoveHead] = useState(false)

  const orgFetcher = async (search?: string) => {
    const result = await getOrgs(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((o: { _id?: string; name?: string }) => ({
      _id: o._id || "",
      name: o.name || "",
    }))
  }

  const parentFetcher = async (search?: string) => {
    const result = await getUnits(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        page: 1,
        limit: 50,
        search: search || undefined,
        ...(orgId ? { organizationId: orgId } : {}),
      } as unknown as ReqType["main"]["unit"]["gets"]["set"],
      { _id: 1, name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((u: { _id?: string; name?: string }) => ({
      _id: u._id || "",
      name: u.name || "",
    }))
  }

  const headFetcher = async (search?: string) => {
    const result = await getUsers(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, first_name: 1, last_name: 1 },
    )
    if (!result.success || !result.body) return []
    return result.body.map((u: { _id?: string; first_name?: string; last_name?: string }) => ({
      _id: u._id || "",
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—",
    }))
  }

  const confirmRemove = () => {
    setHeadId("")
    setRemoveHead(true)
    setConfirmRemoveHead(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const relResult = await updateRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: unit._id,
          ...(orgId ? { organizationId: orgId } : {}),
          ...(parentUnitId ? { parentUnitId } : {}),
        },
        { _id: 1, name: 1 },
      )

      if (!relResult.success) {
        toast.error(relResult.body?.message || "خطا در به‌روزرسانی روابط")
        return
      }

      const shouldAdd = headId && !removeHead && headId !== unit.head?._id
      const shouldRemove = removeHead && unit.head?._id

      if (shouldRemove) {
        const res = await addOrRemoveRoles(
          {
            activeRoleId: getActiveRoleIdFromStore(),
            _id: unit.head!._id,
            removeRoles: [{ name: "UnitHead", scopeType: "unit", scopeId: unit._id }],
          },
          { _id: 1 },
        )
        if (!res.success) {
          toast.error(res.body?.message || "خطا در حذف نقش سرپرست")
          return
        }
      }

      if (shouldAdd) {
        const res = await addOrRemoveRoles(
          {
            activeRoleId: getActiveRoleIdFromStore(),
            _id: headId,
            addRoles: [{ name: "UnitHead", scopeType: "unit", scopeId: unit._id }],
          },
          { _id: 1, roles: 1, units: { _id: 1, name: 1 } },
        )
        if (!res.success) {
          toast.error(res.body?.message || "خطا در اعطای نقش سرپرست")
          return
        }
      }

      toast.success("روابط با موفقیت به‌روزرسانی شد")
      router.refresh()
    } catch {
      toast.error("خطا در به‌روزرسانی روابط")
    } finally {
      setSubmitting(false)
    }
  }

  const originalHeadName = unit.head
    ? [unit.head.first_name, unit.head.last_name].filter(Boolean).join(" ")
    : ""

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={unit.name || "ویرایش روابط"}
        description="ویرایش روابط واحد"
      >
        <Link href={`/admin/units/${unit._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
      </PageHeader>

      <SectionCard
        icon={GitBranch}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="سازمان و ساختار"
        description="سازمان و واحد والد مرتبط با واحد"
      >
        <RelationField
          label="سازمان"
          description="سازمان محل فعالیت واحد"
          value={orgId}
          displayLabel={unit.organization?.name}
          onChange={setOrgId}
          placeholder="انتخاب سازمان…"
          fetcher={orgFetcher}
          disabled={submitting}
        />
        <RelationField
          label="واحد والد"
          description="واحدی که این واحد زیرمجموعه آن است"
          value={parentUnitId}
          displayLabel={unit.parentUnit?.name}
          onChange={setParentUnitId}
          placeholder="انتخاب واحد والد…"
          fetcher={parentFetcher}
          disabled={submitting}
        />
      </SectionCard>

      <SectionCard
        icon={User}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="سرپرست واحد"
        description="سرپرست این واحد و نقش UnitHead"
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-moonlight">سرپرست</p>
              <p className="mt-0.5 text-caption text-fog/60">با انتخاب سرپرست، نقش UnitHead به‌روزرسانی می‌شود</p>
            </div>
            {headId && !removeHead && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemoveHead(true)}
                className="shrink-0 gap-1.5 px-3 text-fog/70 hover:text-ember hover:bg-ember/5"
              >
                <Trash2 className="size-4" />
                حذف سرپرست
              </Button>
            )}
            {removeHead && (
              <span className="shrink-0 rounded-full bg-ember/10 px-2.5 py-0.5 text-caption font-medium text-ember ring-1 ring-inset ring-ember/20">
                حذف می‌شود
              </span>
            )}
          </div>
          <div className={cn("transition-opacity duration-200", removeHead && "pointer-events-none opacity-40")}>
            <SearchSelect
              value={removeHead ? "" : headId}
              onChange={setHeadId}
              placeholder="انتخاب سرپرست…"
              fetcher={headFetcher}
              label="سرپرست"
              disabled={submitting}
              displayLabel={removeHead ? "" : originalHeadName}
            />
          </div>
          <div className="border-b border-steel-border/20" />
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <p className="hidden text-caption text-fog/60 sm:block">
            تغییرات پس از ذخیره روی واحد اعمال می‌شود
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
              onClick={() => router.push(`/admin/units/${unit._id}`)}
              className="gap-2 px-5"
            >
              <X className="size-5" />
              انصراف
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemoveHead}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveHead(false)
        }}
        title="حذف سرپرست واحد"
        description="با حذف، نقش UnitHead از سرپرست فعلی برداشته می‌شود و پس از ذخیره روی واحد اعمال خواهد شد."
        confirmLabel="حذف"
        onConfirm={confirmRemove}
      />
    </div>
  )
}
