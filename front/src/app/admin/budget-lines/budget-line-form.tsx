"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Wallet, Landmark, Tags } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/budgetLine/add"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const blSchema = z.object({
  code: z.string().min(1, "کد ردیف بودجه الزامی است"),
  title: z.string().min(1, "عنوان ردیف بودجه الزامی است"),
  description: z.string().optional(),
  totalAllocated: z.string().optional(),
  totalEncumbered: z.string().optional(),
  totalSpent: z.string().optional(),
  fiscalYearId: z.string().min(1, "انتخاب سال مالی الزامی است"),
  organizationId: z.string().min(1, "انتخاب سازمان الزامی است"),
  unitId: z.string().optional(),
  wareTypeId: z.string().optional(),
})

type BudgetLineData = z.infer<typeof blSchema>

const fiscalYearsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getFiscalYears(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, sortBy: "name", sortOrder: "asc", ...(q ? { name: q } : {}) },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((f) => ({ _id: f._id, name: f.name || "" }))
}

const organizationsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getOrganizations(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((o) => ({ _id: o._id, name: o.name || "" }))
}

const unitsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((u) => ({ _id: u._id, name: u.name || "" }))
}

const wareTypesFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareTypes(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined, sortBy: "name", sortOrder: "asc" },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((w) => ({ _id: w._id, name: w.name || "" }))
}

export function BudgetLineForm() {
  const router = useRouter()

  const form = useForm<BudgetLineData>({
    resolver: zodV4Resolver(blSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      totalAllocated: "",
      totalEncumbered: "",
      totalSpent: "",
      fiscalYearId: "",
      organizationId: "",
      unitId: "",
      wareTypeId: "",
    },
  })

  const onSubmit = async (data: BudgetLineData) => {
    const result = await add(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        code: data.code,
        title: data.title,
        ...(data.description ? { description: data.description } : {}),
        ...(data.totalAllocated ? { totalAllocated: Number(data.totalAllocated) } : {}),
        ...(data.totalEncumbered ? { totalEncumbered: Number(data.totalEncumbered) } : {}),
        ...(data.totalSpent ? { totalSpent: Number(data.totalSpent) } : {}),
        fiscalYearId: data.fiscalYearId,
        organizationId: data.organizationId,
        ...(data.unitId ? { unitId: data.unitId } : {}),
        ...(data.wareTypeId ? { wareTypeId: data.wareTypeId } : {}),
      },
      { _id: 1, code: 1, title: 1 }
    )
    if (result.success) {
      toast.success("ردیف بودجه با موفقیت ایجاد شد")
      router.push("/admin/budget-lines")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد ردیف بودجه")
    }
  }

  return (
    <EntityFormShell
      title="افزودن ردیف بودجه"
      description="ردیف بودجه را برای یک سال مالی و سازمان تعریف کنید؛ مانده ردیف به‌صورت خودکار محاسبه می‌شود."
      backHref="/admin/budget-lines"
      backLabel="بازگشت به ردیف‌های بودجه"
      submitLabel="ثبت ردیف بودجه"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Wallet}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="مشخصات ردیف بودجه"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput
          control={form.control}
          name="code"
          label="کد ردیف بودجه"
          placeholder="مثال: BL-1404-001"
          required
        />
        <FormInput
          control={form.control}
          name="title"
          label="عنوان"
          placeholder="مثال: خرید تجهیزات آزمایشگاهی"
          required
        />
        <FormInput
          control={form.control}
          name="description"
          label="توضیحات"
          placeholder="توضیح مختصری درباره ردیف بودجه"
        />
      </SectionCard>

      <SectionCard
        icon={Wallet}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="مبالغ"
        description="در صورت خالی بودن، مقدار صفر ثبت می‌شود."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormInput control={form.control} name="totalAllocated" label="تخصیص یافته (ریال)" type="number" placeholder="مثال: ۵۰۰۰۰۰۰۰۰" />
          <FormInput control={form.control} name="totalEncumbered" label="تعهد شده (ریال)" type="number" placeholder="مثال: ۲۵۰۰۰۰۰۰" />
          <FormInput control={form.control} name="totalSpent" label="مصرف شده (ریال)" type="number" placeholder="مثال: ۰" />
        </div>
      </SectionCard>

      <SectionCard
        icon={Landmark}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="سال مالی و سازمان"
        description="ردیف بودجه به یک سال مالی و یک سازمان تعلق دارد."
      >
        <FormSearchSelect
          control={form.control}
          name="fiscalYearId"
          label="سال مالی"
          placeholder="سال مالی را جستجو و انتخاب کنید…"
          fetcher={fiscalYearsFetcher}
          required
        />
        <FormSearchSelect
          control={form.control}
          name="organizationId"
          label="سازمان"
          placeholder="سازمان را جستجو و انتخاب کنید…"
          fetcher={organizationsFetcher}
          required
        />
      </SectionCard>

      <SectionCard
        icon={Tags}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title="دامنه اختیاری"
        description="در صورت نیاز، ردیف بودجه را به یک واحد یا نوع کالا محدود کنید."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSearchSelect
            control={form.control}
            name="unitId"
            label="واحد"
            placeholder="واحد را جستجو و انتخاب کنید…"
            fetcher={unitsFetcher}
          />
          <FormSearchSelect
            control={form.control}
            name="wareTypeId"
            label="نوع کالا"
            placeholder="نوع کالا را جستجو و انتخاب کنید…"
            fetcher={wareTypesFetcher}
          />
        </div>
      </SectionCard>
    </EntityFormShell>
  )
}
