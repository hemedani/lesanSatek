"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Gavel, ShoppingCart, CalendarClock } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/tender/add"
import { gets as getPurchasingRequests } from "@/app/actions/purchasingRequest/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const tenderSchema = z.object({
  title: z.string().min(1, "عنوان مناقصه الزامی است"),
  description: z.string().optional(),
  deadline: z.string().min(1, "مهلت ارسال پیشنهاد الزامی است"),
  purchasingRequestId: z.string().min(1, "انتخاب درخواست خرید الزامی است"),
})

type TenderData = z.infer<typeof tenderSchema>

const purchasingRequestsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getPurchasingRequests(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, ...(q ? { title: q } : {}) },
    { _id: 1, title: 1, status: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; title?: string; status?: string }[]).map((pr) => ({
    _id: pr._id,
    name: pr.title || "",
    sublabel: pr.status || undefined,
  }))
}

export function TenderForm() {
  const router = useRouter()

  const form = useForm<TenderData>({
    resolver: zodV4Resolver(tenderSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      purchasingRequestId: "",
    },
  })

  const onSubmit = async (data: TenderData) => {
    const result = await add(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        title: data.title,
        ...(data.description ? { description: data.description } : {}),
        deadline: new Date(data.deadline),
        purchasingRequestId: data.purchasingRequestId,
      },
      { _id: 1, title: 1, status: 1 }
    )
    if (result.success) {
      toast.success("مناقصه با موفقیت ایجاد شد")
      router.push("/admin/tenders")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد مناقصه")
    }
  }

  return (
    <EntityFormShell
      title="مناقصه جدید"
      helpTopicId="admin-tenders"
      helpTooltip="راهنمای مناقصه"
      description="برای یک درخواست خرید مناقصه ایجاد کنید و مهلت دریافت پیشنهاد را تعیین کنید."
      backHref="/admin/tenders"
      backLabel="بازگشت به مناقصات"
      submitLabel="ثبت مناقصه"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Gavel}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="مشخصات مناقصه"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput
          control={form.control}
          name="title"
          label="عنوان مناقصه"
          placeholder="مثال: مناقصه تأمین تجهیزات آزمایشگاهی"
          required
        />
        <FormTextarea
          control={form.control}
          name="description"
          label="توضیحات"
          placeholder="توضیح مختصری درباره مناقصه"
          rows={3}
        />
      </SectionCard>

      <SectionCard
        icon={ShoppingCart}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="درخواست خرید"
        description="مناقصه به یک درخواست خرید متصل می‌شود."
      >
        <FormSearchSelect
          control={form.control}
          name="purchasingRequestId"
          label="درخواست خرید"
          placeholder="درخواست خرید را جستجو و انتخاب کنید…"
          fetcher={purchasingRequestsFetcher}
          required
        />
      </SectionCard>

      <SectionCard
        icon={CalendarClock}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title="مهلت"
        description="مهلت ارسال پیشنهاد توسط فروشندگان."
      >
        <FormJalaliDatePicker
          control={form.control}
          name="deadline"
          label="مهلت ارسال پیشنهاد"
          placeholder="انتخاب تاریخ"
          required
        />
      </SectionCard>
    </EntityFormShell>
  )
}
