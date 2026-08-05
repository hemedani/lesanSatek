"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Map } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/state/add"
import { update } from "@/app/actions/state/update"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const stateSchema = z.object({
  name: z.string().min(1, "نام استان الزامی است"),
  enName: z.string().optional(),
})

type StateData = z.infer<typeof stateSchema>

interface StateFormProps {
  item?: {
    _id: string
    name?: string
    enName?: string
  }
}

export function StateForm({ item }: StateFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)

  const form = useForm<StateData>({
    resolver: zodV4Resolver(stateSchema),
    defaultValues: {
      name: item?.name || "",
      enName: item?.enName || "",
    },
  })

  const onSubmit = async (data: StateData) => {
    const activeRoleId = getActiveRoleIdFromStore()

    if (isEdit && item) {
      const result = await update(
        { activeRoleId, _id: item._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      )
      if (result.success) {
        toast.success("استان با موفقیت به‌روزرسانی شد")
        router.push("/admin/states")
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی استان")
      }
      return
    }

    const result = await add(
      { activeRoleId, name: data.name, enName: data.enName || undefined },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("استان با موفقیت ایجاد شد")
      router.push("/admin/states")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد استان")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش استان" : "افزودن استان"}
      helpTopicId="admin-states"
      helpTooltip="راهنمای استان"
      description="استان، نخستین سطح سلسله‌مراتب موقعیت جغرافیایی است و شهرها زیرمجموعه آن قرار می‌گیرند."
      backHref="/admin/states"
      backLabel="بازگشت به استان‌ها"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت استان"}
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Map}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات استان"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput
          control={form.control}
          name="name"
          label="نام استان"
          placeholder="مثال: تهران"
          required
        />
        <FormInput
          control={form.control}
          name="enName"
          label="نام لاتین"
          placeholder="مثال: Tehran"
        />
      </SectionCard>
    </EntityFormShell>
  )
}
