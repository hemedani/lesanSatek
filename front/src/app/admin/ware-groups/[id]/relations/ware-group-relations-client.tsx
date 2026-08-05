"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, Check, X, Grid3X3, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SearchSelect } from "@/components/form/form-search-select"
import { SearchMultiSelect } from "@/components/form/form-search-multi-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { updateRelations } from "@/app/actions/wareGroup/updateRelations"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { gets as getWareClasses } from "@/app/actions/wareClass/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface WareGroupRelationsProps {
  group: {
    _id: string
    name?: string
    enName?: string
    wareType?: { _id: string; name?: string }
    wareClasses?: { _id: string; name?: string }[]
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

export function WareGroupRelationsClient({ group }: WareGroupRelationsProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [wareTypeId, setWareTypeId] = useState(group.wareType?._id || "")
  const [wareClassIds, setWareClassIds] = useState<string[]>(
    (group.wareClasses || []).map((c) => c._id)
  )
  const [nameMap, setNameMap] = useState<Record<string, string>>(
    Object.fromEntries((group.wareClasses || []).map((c) => [c._id, c.name || ""]))
  )

  const wareTypeFetcher = async (search?: string) => {
    const result = await getWareTypes(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
      { _id: 1, name: 1 }
    )
    if (!result.success || !result.body) return []
    return (result.body as { _id: string; name?: string }[]).map((t) => ({
      _id: t._id,
      name: t.name || "",
    }))
  }

  const wareClassFetcher = async (search?: string) => {
    const result = await getWareClasses(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        page: 1,
        limit: 50,
        search: search || undefined,
        ...(wareTypeId ? { wareTypeId } : {}),
      },
      { _id: 1, name: 1 }
    )
    if (!result.success || !result.body) return []
    return (result.body as { _id: string; name?: string }[]).map((c) => ({
      _id: c._id,
      name: c.name || "",
    }))
  }

  const handleWareTypeChange = (value: string) => {
    setWareTypeId(value)
    setWareClassIds([])
    setNameMap({})
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateRelations(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: group._id,
          ...(wareTypeId ? { wareTypeId } : {}),
          ...(wareClassIds.length ? { wareClassIds } : {}),
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
        title={group.name || "ویرایش روابط"}
        description="ویرایش روابط گروه کالا"
      >
        <Link href={`/admin/ware-groups/${group._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ویرایش
          </Button>
        </Link>
      <HelpLauncher topicId="admin-ware-groups" tooltip="راهنمای روابط گروه کالا" />
      </PageHeader>

      <SectionCard
        icon={Grid3X3}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="نوع کالا"
        description="نوع کالایی که این گروه زیرمجموعه آن قرار می‌گیرد"
      >
        <div className="space-y-2.5">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-moonlight">نوع کالا</p>
            <p className="mt-0.5 text-caption text-fog/60">
              با تغییر نوع کالا، رده‌های انتخاب‌شده پاک می‌شوند
            </p>
          </div>
          <SearchSelect
            value={wareTypeId}
            onChange={handleWareTypeChange}
            placeholder="انتخاب نوع کالا…"
            fetcher={wareTypeFetcher}
            label="نوع کالا"
            disabled={submitting}
            displayLabel={group.wareType?.name}
          />
          <div className="border-b border-steel-border/20" />
        </div>
      </SectionCard>

      <SectionCard
        icon={Layers}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="رده‌های کالا"
        description="رده‌های کالای مرتبط با این گروه"
      >
        <div className="space-y-2.5">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-moonlight">رده‌های کالا</p>
            <p className="mt-0.5 text-caption text-fog/60">
              {wareTypeId
                ? "رده‌های زیرمجموعه نوع کالای انتخابی"
                : "ابتدا نوع کالا را انتخاب کنید تا رده‌ها بارگذاری شوند"}
            </p>
          </div>
          <SearchMultiSelect
            value={wareClassIds}
            onChange={setWareClassIds}
            placeholder="انتخاب رده‌های کالا…"
            fetcher={wareClassFetcher}
            label="رده‌های کالا"
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
            تغییرات پس از ذخیره روی گروه کالا اعمال می‌شود
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
              onClick={() => router.push(`/admin/ware-groups/${group._id}`)}
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
