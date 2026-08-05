"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, Boxes } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SearchSelect } from "@/components/form/form-search-select"
import { updateRelations } from "@/app/actions/ware/updateRelations"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { gets as getWareClasses } from "@/app/actions/wareClass/gets"
import { gets as getWareGroups } from "@/app/actions/wareGroup/gets"
import { gets as getWareModels } from "@/app/actions/wareModel/gets"
import { gets as getManufacturers } from "@/app/actions/manufacturer/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface WareRelationsProps {
  ware: {
    _id: string
    name?: string
    enName?: string
    manufacturer?: { _id: string; name?: string }
    wareType?: { _id: string; name?: string }
    wareClass?: { _id: string; name?: string }
    wareGroup?: { _id: string; name?: string }
    wareModel?: { _id: string; name?: string }
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

export function WareRelationsClient({ ware }: WareRelationsProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [manufacturerId, setManufacturerId] = useState(ware.manufacturer?._id || "")
  const [wareTypeId, setWareTypeId] = useState(ware.wareType?._id || "")
  const [wareClassId, setWareClassId] = useState(ware.wareClass?._id || "")
  const [wareGroupId, setWareGroupId] = useState(ware.wareGroup?._id || "")
  const [wareModelId, setWareModelId] = useState(ware.wareModel?._id || "")

  const fetchers: Record<string, (search?: string) => Promise<{ _id: string; name: string }[]>> = {
    manufacturer: async (search) => {
      const result = await getManufacturers(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
        { _id: 1, name: 1 }
      )
      if (!result.success || !result.body) return []
      return (result.body as { _id: string; name?: string }[]).map((m) => ({
        _id: m._id,
        name: m.name || "",
      }))
    },
    wareType: async (search) => {
      const result = await getWareTypes(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
        { _id: 1, name: 1 }
      )
      if (!result.success || !result.body) return []
      return (result.body as { _id: string; name?: string }[]).map((t) => ({
        _id: t._id,
        name: t.name || "",
      }))
    },
    wareClass: async (search) => {
      const result = await getWareClasses(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
        { _id: 1, name: 1 }
      )
      if (!result.success || !result.body) return []
      return (result.body as { _id: string; name?: string }[]).map((c) => ({
        _id: c._id,
        name: c.name || "",
      }))
    },
    wareGroup: async (search) => {
      const result = await getWareGroups(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
        { _id: 1, name: 1 }
      )
      if (!result.success || !result.body) return []
      return (result.body as { _id: string; name?: string }[]).map((g) => ({
        _id: g._id,
        name: g.name || "",
      }))
    },
    wareModel: async (search) => {
      const result = await getWareModels(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
        { _id: 1, name: 1 }
      )
      if (!result.success || !result.body) return []
      return (result.body as { _id: string; name?: string }[]).map((m) => ({
        _id: m._id,
        name: m.name || "",
      }))
    },
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: ware._id,
          ...(manufacturerId ? { manufacturerId } : {}),
          ...(wareTypeId ? { wareTypeId } : {}),
          ...(wareClassId ? { wareClassId } : {}),
          ...(wareGroupId ? { wareGroupId } : {}),
          ...(wareModelId ? { wareModelId } : {}),
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={ware.name || "ویرایش روابط"}
        description="ویرایش روابط کالا"
      >
        <Link href={`/admin/wares/${ware._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به کالا
          </Button>
        </Link>
      <HelpLauncher topicId="admin-wares" tooltip="راهنمای روابط کالا" />
      </PageHeader>

      <SectionCard
        icon={Boxes}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="سلسله‌مراتب دسته‌بندی"
        description="شاخه‌ای از سلسله‌مراتب که کالا در آن قرار می‌گیرد"
      >
        <RelationField
          label="تولیدکننده"
          value={manufacturerId}
          displayLabel={ware.manufacturer?.name}
          onChange={setManufacturerId}
          placeholder="انتخاب تولیدکننده…"
          fetcher={fetchers.manufacturer}
          disabled={submitting}
        />
        <RelationField
          label="نوع کالا"
          description="نوع کالای این کالا"
          value={wareTypeId}
          displayLabel={ware.wareType?.name}
          onChange={setWareTypeId}
          placeholder="انتخاب نوع کالا…"
          fetcher={fetchers.wareType}
          disabled={submitting}
        />
        <RelationField
          label="کلاس کالا"
          description="کلاس کالای این کالا"
          value={wareClassId}
          displayLabel={ware.wareClass?.name}
          onChange={setWareClassId}
          placeholder="انتخاب کلاس کالا…"
          fetcher={fetchers.wareClass}
          disabled={submitting}
        />
        <RelationField
          label="گروه کالا"
          description="گروه کالای این کالا"
          value={wareGroupId}
          displayLabel={ware.wareGroup?.name}
          onChange={setWareGroupId}
          placeholder="انتخاب گروه کالا…"
          fetcher={fetchers.wareGroup}
          disabled={submitting}
        />
        <RelationField
          label="مدل کالا"
          description="مدل کالای این کالا"
          value={wareModelId}
          displayLabel={ware.wareModel?.name}
          onChange={setWareModelId}
          placeholder="انتخاب مدل کالا…"
          fetcher={fetchers.wareModel}
          disabled={submitting}
        />
      </SectionCard>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <p className="hidden text-caption text-fog/60 sm:block">
            تغییرات پس از ذخیره روی کالا اعمال می‌شود
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
              onClick={() => router.push(`/admin/wares/${ware._id}`)}
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
