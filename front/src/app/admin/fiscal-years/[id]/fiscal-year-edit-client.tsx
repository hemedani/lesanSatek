"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, CalendarRange, Building2, Loader2, Check, X, Trash2, Lock, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { update } from "@/app/actions/fiscalYear/update"
import { remove } from "@/app/actions/fiscalYear/remove"
import { close } from "@/app/actions/fiscalYear/close"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const fySchema = z.object({
  name: z.string().min(1, "نام سال مالی الزامی است"),
  startDate: z.string().min(1, "تاریخ شروع الزامی است"),
  endDate: z.string().min(1, "تاریخ پایان الزامی است"),
  status: z.enum(["open", "closed"]).default("open"),
  isActive: z.boolean(),
})

type FiscalYearData = z.infer<typeof fySchema>

interface FiscalYearEditFormProps {
  fiscalYear: {
    _id: string
    name?: string
    startDate?: string
    endDate?: string
    status?: string
    isActive?: boolean
    organization?: { _id: string; name?: string }
  }
}

const statusOptions = [
  { value: "open", label: "باز" },
  { value: "closed", label: "بسته" },
]

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

export function FiscalYearEditClient({ fiscalYear }: FiscalYearEditFormProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [closing, setClosing] = useState(false)

  const form = useForm<FiscalYearData>({
    resolver: zodV4Resolver(fySchema),
    defaultValues: {
      name: fiscalYear.name || "",
      startDate: fiscalYear.startDate ? new Date(fiscalYear.startDate).toISOString() : "",
      endDate: fiscalYear.endDate ? new Date(fiscalYear.endDate).toISOString() : "",
      status: fiscalYear.status === "closed" ? "closed" : "open",
      isActive: fiscalYear.isActive ?? false,
    },
  })

  const onSubmit = async (data: FiscalYearData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: fiscalYear._id,
          name: data.name,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: data.status,
          isActive: data.isActive,
        },
        { _id: 1, name: 1 },
      )
      if (result.success) {
        toast.success("سال مالی با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی سال مالی")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی سال مالی")
    }
  }

  const handleClose = async () => {
    setClosing(true)
    try {
      const result = await close({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: fiscalYear._id,
      })
      if (result.success) {
        toast.success("سال مالی با موفقیت بسته شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در بستن سال مالی")
      }
    } catch {
      toast.error("خطا در بستن سال مالی")
    } finally {
      setClosing(false)
      setShowClose(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({
        _id: fiscalYear._id,
      })
      if (result.success) {
        toast.success("سال مالی با موفقیت حذف شد")
        router.push("/admin/fiscal-years")
      } else {
        toast.error(result.body?.message || "خطا در حذف سال مالی")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف سال مالی")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={fiscalYear.name || "ویرایش سال مالی"}
        description="ویرایش اطلاعات سال مالی"
      >
        <Link href="/admin/fiscal-years">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به سال‌های مالی
          </Button>
        </Link>
        {fiscalYear.status !== "closed" && (
          <Button
            variant="ghost"
            onClick={() => setShowClose(true)}
            className="gap-2 px-4 text-amber-400 hover:bg-amber-500/5 hover:text-amber-400"
          >
            <Lock className="size-5" />
            بستن
          </Button>
        )}
        <Link href={`/admin/fiscal-years/${fiscalYear._id}/relations`}>
          <Button variant="ghost" className="gap-2 px-4">
            <Share2 className="size-5" />
            روابط
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
            icon={CalendarRange}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="دوره مالی"
          >
            <FormInput
              control={form.control}
              name="name"
              label="نام سال مالی"
              placeholder="مثال: سال مالی ۱۴۰۴"
              required
              disabled={submitting}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormJalaliDatePicker control={form.control} name="startDate" label="تاریخ شروع" required disabled={submitting} />
              <FormJalaliDatePicker control={form.control} name="endDate" label="تاریخ پایان" required disabled={submitting} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSelect control={form.control} name="status" label="وضعیت" placeholder="انتخاب وضعیت" options={statusOptions} required disabled={submitting} />
              <FormCheckbox control={form.control} name="isActive" label="سال مالی فعال" disabled={submitting} />
            </div>
          </SectionCard>

          <SectionCard
            icon={Building2}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="سازمان"
          >
            <div className="flex h-10 items-center gap-2 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-body-sm text-fog">
              <Building2 className="size-4 shrink-0 text-fog/60" />
              {fiscalYear.organization?.name || "—"}
              <span className="ms-auto text-caption text-fog/50">برای تغییر سازمان، از صفحه روابط استفاده کنید</span>
            </div>
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
                  onClick={() => router.push("/admin/fiscal-years")}
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
        open={showClose}
        onOpenChange={setShowClose}
        title="بستن سال مالی"
        description="آیا از بستن این سال مالی اطمینان دارید؟ پس از بستن، عملیات بودجه‌ای بیشتر متوقف می‌شود."
        confirmLabel="بستن"
        onConfirm={handleClose}
        loading={closing}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف سال مالی"
        description="آیا از حذف این سال مالی اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
