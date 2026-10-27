"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { resolveAccountingError } from "@/components/accounting/errors"
import { formatMonthCode, monthBounds } from "@/components/accounting/money"
import type { AccountingPeriod } from "@/components/accounting/types"
import { add } from "@/app/actions/accountingPeriod/add"
import { update } from "@/app/actions/accountingPeriod/update"

const periodSchema = z.object({
  code: z.string().min(1, "کد دوره الزامی است"),
  name: z.string().min(1, "نام دوره الزامی است"),
  startDate: z.string().min(1, "تاریخ شروع الزامی است"),
  endDate: z.string().min(1, "تاریخ پایان الزامی است"),
  fiscalYearId: z.string().optional(),
})

type PeriodFormData = z.infer<typeof periodSchema>

interface PeriodFormProps {
  organizationId: string
  fiscalYears: { _id: string; name?: string }[]
  initial?: AccountingPeriod
  basePath: string
  canManage: boolean
}

function PeriodForm({ organizationId, fiscalYears, initial, basePath, canManage }: PeriodFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const now = new Date()
  const bounds = monthBounds(now)
  const defaultCode = formatMonthCode(now)

  const form = useForm<PeriodFormData>({
    resolver: zodV4Resolver(periodSchema),
    defaultValues: {
      code: initial?.code || defaultCode,
      name: initial?.name || `دوره ${defaultCode}`,
      startDate: initial?.startDate || bounds.startDate,
      endDate: initial?.endDate || bounds.endDate,
      fiscalYearId: initial?.fiscalYear?._id || "",
    },
  })

  const onSubmit = async (data: PeriodFormData) => {
    if (!canManage) {
      toast.error("شما دسترسی مدیریت دوره‌های حسابداری را ندارید.")
      return
    }
    setSubmitting(true)
    const payload = {
      code: data.code.trim(),
      name: data.name.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      ...(data.fiscalYearId ? { fiscalYearId: data.fiscalYearId } : {}),
      organizationId,
    }
    const result = initial
      ? await update({
          _id: initial._id,
          name: data.name.trim(),
          startDate: data.startDate,
          endDate: data.endDate,
        })
      : await add(payload)
    setSubmitting(false)

    if (result.success) {
      toast.success(initial ? "دوره حسابداری به‌روزرسانی شد" : "دوره حسابداری ایجاد شد")
      router.push(`${basePath}/periods`)
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در ذخیره دوره حسابداری"))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput control={form.control} name="code" label="کد دوره" placeholder="2026-10" required disabled={!!initial} />
        <FormInput control={form.control} name="name" label="نام دوره" placeholder="دوره 2026-10" required />
        <FormJalaliDatePicker control={form.control} name="startDate" label="تاریخ شروع" required />
        <FormJalaliDatePicker control={form.control} name="endDate" label="تاریخ پایان" required />
        <FormSelect
          control={form.control}
          name="fiscalYearId"
          label="سال مالی"
          placeholder="بدون سال مالی"
          options={fiscalYears.map((year) => ({ value: year._id, label: year.name || year._id }))}
          disabled={!!initial}
        />
      </div>
      <p className="text-xs text-fog/60">
        کد دوره به صورت سال-ماه میلادی و مطابق با بازه ماه ذخیره می‌شود. تغییر دستی آن توصیه نمی‌شود.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting || !canManage} className="gap-2">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {initial ? "ذخیره تغییرات" : "ایجاد دوره"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`${basePath}/periods`)}>
          انصراف
        </Button>
      </div>
    </form>
  )
}

export { PeriodForm }
