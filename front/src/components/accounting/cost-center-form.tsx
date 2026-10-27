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
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { COST_CENTER_TYPE_OPTIONS } from "@/components/accounting/labels"
import { resolveAccountingError } from "@/components/accounting/errors"
import type { CostCenter } from "@/components/accounting/types"
import { add } from "@/app/actions/costCenter/add"
import { update } from "@/app/actions/costCenter/update"

const costCenterSchema = z.object({
  code: z.string().min(1, "کد مرکز هزینه الزامی است"),
  name: z.string().min(1, "نام مرکز هزینه الزامی است"),
  description: z.string().optional(),
  type: z.string().optional(),
  unitId: z.string().optional(),
  responsibleUserId: z.string().optional(),
  isActive: z.boolean(),
})

type CostCenterFormData = z.infer<typeof costCenterSchema>

interface CostCenterFormProps {
  organizationId: string
  units: { _id: string; name?: string }[]
  users: { _id: string; first_name?: string; last_name?: string }[]
  initial?: CostCenter
  basePath: string
  canManage: boolean
}

function CostCenterForm({
  organizationId,
  units,
  users,
  initial,
  basePath,
  canManage,
}: CostCenterFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CostCenterFormData>({
    resolver: zodV4Resolver(costCenterSchema),
    defaultValues: {
      code: initial?.code || "",
      name: initial?.name || "",
      description: initial?.description || "",
      type: initial?.type || "cost",
      unitId: initial?.unit?._id || "",
      responsibleUserId: initial?.responsibleUser?._id || "",
      isActive: initial?.isActive ?? true,
    },
  })

  const onSubmit = async (data: CostCenterFormData) => {
    if (!canManage) {
      toast.error("شما دسترسی مدیریت مراکز هزینه را ندارید.")
      return
    }
    setSubmitting(true)
    const payload = {
      code: data.code.trim(),
      name: data.name.trim(),
      ...(data.description ? { description: data.description.trim() } : {}),
      type: data.type || "cost",
      isActive: data.isActive,
      organizationId,
      ...(data.unitId ? { unitId: data.unitId } : {}),
      ...(data.responsibleUserId ? { responsibleUserId: data.responsibleUserId } : {}),
    }
    const result = initial
      ? await update({ _id: initial._id, ...payload })
      : await add(payload)
    setSubmitting(false)

    if (result.success) {
      toast.success(initial ? "مرکز هزینه به‌روزرسانی شد" : "مرکز هزینه ایجاد شد")
      router.push(`${basePath}/cost-centers`)
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در ذخیره مرکز هزینه"))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput control={form.control} name="code" label="کد مرکز هزینه" placeholder="CC-001" required />
        <FormInput control={form.control} name="name" label="نام مرکز هزینه" placeholder="هزینه‌های اداری" required />
        <FormSelect
          control={form.control}
          name="type"
          label="نوع"
          options={COST_CENTER_TYPE_OPTIONS}
          required
        />
        <FormSelect
          control={form.control}
          name="unitId"
          label="واحد"
          placeholder="بدون واحد"
          options={units.map((unit) => ({ value: unit._id, label: unit.name || unit._id }))}
        />
        <FormSelect
          control={form.control}
          name="responsibleUserId"
          label="مسئول"
          placeholder="بدون مسئول"
          options={users.map((user) => ({
            value: user._id,
            label: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user._id,
          }))}
        />
      </div>
      <FormTextarea control={form.control} name="description" label="توضیحات" rows={3} />
      <FormCheckbox control={form.control} name="isActive" label="فعال" />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting || !canManage} className="gap-2">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {initial ? "ذخیره تغییرات" : "ایجاد مرکز هزینه"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`${basePath}/cost-centers`)}>
          انصراف
        </Button>
      </div>
    </form>
  )
}

export { CostCenterForm }
