"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ReceiptText, ShoppingCart, User } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/paymentOrder/add"
import { gets as getPurchasingRequests } from "@/app/actions/purchasingRequest/gets"
import { gets as getStores } from "@/app/actions/store/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getMe } from "@/app/actions/user/getMe"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const paymentOrderSchema = z.object({
  title: z.string().min(1, "عنوان دستور پرداخت الزامی است"),
  amount: z.coerce.number().min(1, "مبلغ باید حداقل ۱ باشد"),
  description: z.string().optional(),
  purchasingRequestId: z.string().min(1, "انتخاب درخواست خرید الزامی است"),
  payToId: z.string().optional(),
  financialUnitId: z.string().optional(),
})

type PaymentOrderData = z.infer<typeof paymentOrderSchema>

const purchasingRequestsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getPurchasingRequests(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined },
    { _id: 1, title: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; title?: string }[]).map((pr) => ({
    _id: pr._id,
    name: pr.title || "",
  }))
}

const payToFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getStores(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({
    _id: s._id,
    name: s.name || "",
  }))
}

const financialUnitFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((u) => ({
    _id: u._id,
    name: u.name || "",
  }))
}

export function PaymentOrderForm() {
  const router = useRouter()

  const form = useForm<PaymentOrderData>({
    resolver: zodV4Resolver(paymentOrderSchema),
    defaultValues: {
      title: "",
      amount: undefined,
      description: "",
      purchasingRequestId: "",
      payToId: "",
      financialUnitId: "",
    },
  })

  const onSubmit = async (data: PaymentOrderData) => {
    try {
      const meResult = await getMe({ _id: 1, first_name: 1, last_name: 1 })
      const issuedById = meResult.success && meResult.body?._id ? meResult.body._id : ""
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          title: data.title,
          amount: data.amount,
          ...(data.description ? { description: data.description } : {}),
          purchasingRequestId: data.purchasingRequestId,
          issuedById,
          payToId: data.payToId || "",
          financialUnitId: data.financialUnitId || "",
        },
        { _id: 1, title: 1, amount: 1, status: 1 }
      )
      if (result.success) {
        toast.success("دستور پرداخت با موفقیت ایجاد شد")
        router.push("/admin/payment-orders")
      } else {
        toast.error(result.body?.message || "خطا در ایجاد دستور پرداخت")
      }
    } catch {
      toast.error("خطا در ایجاد دستور پرداخت")
    }
  }

  return (
    <EntityFormShell
      title="دستور پرداخت جدید"
      description="دستور پرداخت برای یک درخواست خرید صادر کنید."
      backHref="/admin/payment-orders"
      backLabel="بازگشت به دستورات پرداخت"
      submitLabel="ثبت دستور پرداخت"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={ReceiptText}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="مشخصات دستور پرداخت"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput
          control={form.control}
          name="title"
          label="عنوان"
          placeholder="مثال: پرداخت فاکتور تأمین تجهیزات"
          required
        />
        <FormInput
          control={form.control}
          name="amount"
          label="مبلغ (ریال)"
          placeholder="مثال: ۵۰۰۰۰۰۰"
          type="number"
          required
        />
        <FormTextarea
          control={form.control}
          name="description"
          label="توضیحات"
          placeholder="توضیح مختصری درباره این پرداخت"
          rows={3}
        />
      </SectionCard>

      <SectionCard
        icon={ShoppingCart}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="درخواست خرید"
        description="دستور پرداخت به یک درخواست خرید متصل می‌شود."
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
        icon={User}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title="دریافت‌کننده و واحد مالی"
        description="گزینه‌های اختیاری برای مشخص کردن دریافت‌کننده وجه."
      >
        <FormSearchSelect
          control={form.control}
          name="payToId"
          label="دریافت‌کننده (فروشگاه)"
          placeholder="فروشگاه دریافت‌کننده وجه را جستجو کنید…"
          fetcher={payToFetcher}
        />
        <FormSearchSelect
          control={form.control}
          name="financialUnitId"
          label="واحد مالی"
          placeholder="واحد مالی مرتبط را جستجو کنید…"
          fetcher={financialUnitFetcher}
        />
      </SectionCard>
    </EntityFormShell>
  )
}