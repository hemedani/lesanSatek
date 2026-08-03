"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { CalendarRange, Building2 } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/fiscalYear/add"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const fySchema = z.object({
  name: z.string().min(1, "نام سال مالی الزامی است"),
  startDate: z.string().min(1, "تاریخ شروع الزامی است"),
  endDate: z.string().min(1, "تاریخ پایان الزامی است"),
  status: z.enum(["open", "closed"]).default("open"),
  isActive: z.boolean(),
  organizationId: z.string().min(1, "انتخاب سازمان الزامی است"),
})

type FiscalYearData = z.infer<typeof fySchema>

const statusOptions = [
  { value: "open", label: "باز" },
  { value: "closed", label: "بسته" },
]

const organizationsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getOrganizations(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((o) => ({ _id: o._id, name: o.name || "" }))
}

export function FiscalYearForm() {
  const router = useRouter()

  const form = useForm<FiscalYearData>({
    resolver: zodV4Resolver(fySchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      status: "open",
      isActive: false,
      organizationId: "",
    },
  })

  const onSubmit = async (data: FiscalYearData) => {
    const result = await add(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status,
        isActive: data.isActive,
        organizationId: data.organizationId,
      },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("سال مالی با موفقیت ایجاد شد")
      router.push("/admin/fiscal-years")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد سال مالی")
    }
  }

  return (
    <EntityFormShell
      title="افزودن سال مالی"
      description="دوره مالی برای مدیریت بودجه سازمان تعریف کنید؛ تنها یک سال مالی معمولاً فعال است."
      backHref="/admin/fiscal-years"
      backLabel="بازگشت به سال‌های مالی"
      submitLabel="ثبت سال مالی"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={CalendarRange}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="دوره مالی"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput
          control={form.control}
          name="name"
          label="نام سال مالی"
          placeholder="مثال: سال مالی ۱۴۰۴"
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormJalaliDatePicker control={form.control} name="startDate" label="تاریخ شروع" required />
          <FormJalaliDatePicker control={form.control} name="endDate" label="تاریخ پایان" required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect control={form.control} name="status" label="وضعیت" placeholder="انتخاب وضعیت" options={statusOptions} required />
          <FormCheckbox control={form.control} name="isActive" label="سال مالی فعال" />
        </div>
      </SectionCard>

      <SectionCard
        icon={Building2}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="سازمان"
        description="سازمانی که سال مالی برای آن تعریف می‌شود"
      >
        <FormSearchSelect
          control={form.control}
          name="organizationId"
          label="سازمان"
          placeholder="سازمان را جستجو و انتخاب کنید…"
          fetcher={organizationsFetcher}
          required
        />
      </SectionCard>
    </EntityFormShell>
  )
}
