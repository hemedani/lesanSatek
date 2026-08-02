"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Building2, ClipboardList, Loader2, Check, X, Share2, Trash2, MapPinned } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { LocationPicker } from "@/components/ui/location-picker"
import type { GeoPoint } from "@/components/ui/location-picker"
import { update } from "@/app/actions/organization/update"
import { remove } from "@/app/actions/organization/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const orgSchema = z.object({
  name: z.string().min(1, "نام سازمان الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type OrgData = z.infer<typeof orgSchema>

interface OrgEditFormProps {
  org: {
    _id: string
    name?: string
    enName?: string
    description?: string
    isActive?: boolean
    location?: GeoPoint
  }
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
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
          <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export function OrgEditClient({ org }: OrgEditFormProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [geoLocation, setGeoLocation] = useState<GeoPoint>(org.location || null)

  const form = useForm<OrgData>({
    resolver: zodV4Resolver(orgSchema),
    defaultValues: {
      name: org.name || "",
      enName: org.enName || "",
      description: org.description || "",
      isActive: org.isActive ?? true,
    },
  })

  const onSubmit = async (data: OrgData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: org._id,
          name: data.name,
          enName: data.enName || undefined,
          description: data.description || undefined,
          isActive: data.isActive,
          ...(geoLocation ? { location: geoLocation } : {}),
        },
        { _id: 1, name: 1 },
      )
      if (result.success) {
        toast.success("سازمان با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی سازمان")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی سازمان")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: org._id,
      })
      if (result.success) {
        toast.success("سازمان با موفقیت حذف شد")
        router.push("/admin/organizations")
      } else {
        toast.error(result.body?.message || "خطا در حذف سازمان")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف سازمان")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={org.name || "ویرایش سازمان"}
        description="ویرایش اطلاعات سازمان"
      >
        <Link href="/admin/organizations">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به سازمان‌ها
          </Button>
        </Link>
        <Link href={`/admin/organizations/${org._id}/relations`}>
          <Button variant="ghost" className="gap-2 px-4">
            <Share2 className="size-5" />
            ویرایش روابط
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={() => setShowDelete(true)}
          className="gap-2 px-4 text-ember hover:bg-ember/5 hover:text-ember"
        >
          <Trash2 className="size-5" />
          حذف
        </Button>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={Building2}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات اصلی"
          >
            <FormInput
              control={form.control}
              name="name"
              label="نام سازمان"
              placeholder="مثال: شرکت نمونه"
              required
              disabled={submitting}
            />
            <FormInput
              control={form.control}
              name="enName"
              label="نام انگلیسی"
              placeholder="Example: Sample Inc."
              disabled={submitting}
            />
          </SectionCard>

          <SectionCard
            icon={ClipboardList}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="توضیحات و وضعیت"
          >
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره سازمان…"
              rows={3}
              disabled={submitting}
            />
            <FormCheckbox control={form.control} name="isActive" label="فعال" disabled={submitting} />
          </SectionCard>

          <SectionCard
            icon={MapPinned}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title="موقعیت جغرافیایی"
          >
            <LocationPicker value={geoLocation} onChange={setGeoLocation} />
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Check className="size-5" />
                  )}
                  ذخیره تغییرات
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={submitting}
                  onClick={() => router.push("/admin/organizations")}
                  className="gap-2 px-5"
                >
                  <X className="size-5" />
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف سازمان"
        description="آیا از حذف این سازمان اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
