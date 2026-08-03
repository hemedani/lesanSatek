"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { MapPin, Building2 } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/city/add"
import { gets as getStates } from "@/app/actions/state/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const citySchema = z.object({
  name: z.string().min(1, "نام شهر الزامی است"),
  enName: z.string().optional(),
  stateId: z.string().min(1, "انتخاب استان الزامی است"),
})

type CityData = z.infer<typeof citySchema>

const statesFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getStates(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

export function CityForm() {
  const router = useRouter()

  const form = useForm<CityData>({
    resolver: zodV4Resolver(citySchema),
    defaultValues: {
      name: "",
      enName: "",
      stateId: "",
    },
  })

  const onSubmit = async (data: CityData) => {
    const result = await add(
      { activeRoleId: getActiveRoleIdFromStore(), name: data.name, enName: data.enName || undefined, stateId: data.stateId },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("شهر با موفقیت ایجاد شد")
      router.push("/admin/cities")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد شهر")
    }
  }

  return (
    <EntityFormShell
      title="افزودن شهر"
      description="شهر، دومین سطح سلسله‌مراتب موقعیت جغرافیایی است و زیرمجموعه یک استان قرار می‌گیرد."
      backHref="/admin/cities"
      backLabel="بازگشت به شهرها"
      submitLabel="ثبت شهر"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={MapPin}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات شهر"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            control={form.control}
            name="name"
            label="نام شهر"
            placeholder="مثال: تهران"
            required
          />
          <FormInput
            control={form.control}
            name="enName"
            label="نام لاتین"
            placeholder="مثال: Tehran"
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Building2}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="استان"
        description="استانی که شهر زیرمجموعه آن قرار می‌گیرد"
      >
        <FormSearchSelect
          control={form.control}
          name="stateId"
          label="استان"
          placeholder="استان را جستجو و انتخاب کنید…"
          fetcher={statesFetcher}
          required
        />
      </SectionCard>
    </EntityFormShell>
  )
}
