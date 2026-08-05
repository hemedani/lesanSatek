"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, ReceiptText, Loader2, Check, X, Trash2, ShoppingCart, Store } from "lucide-react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SectionCard } from "@/components/form/section-card"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { update } from "@/app/actions/paymentOrder/update"
import { remove } from "@/app/actions/paymentOrder/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { gets as getStores } from "@/app/actions/store/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"

const paymentOrderSchema = z.object({
  title: z.string().min(1, "عنوان دستور پرداخت الزامی است"),
  amount: z.coerce.number().min(1, "مبلغ باید حداقل ۱ باشد"),
  description: z.string().optional(),
  payToId: z.string().optional(),
  financialUnitId: z.string().optional(),
})

type PaymentOrderData = z.infer<typeof paymentOrderSchema>

export interface PaymentOrder {
  _id: string
  title?: string
  amount?: number
  description?: string
  status?: string
  paidAt?: string
  purchasingRequest?: { _id: string; title?: string }
  payTo?: { _id: string; name?: string }
  financialUnit?: { _id: string; name?: string }
}

interface PaymentOrderEditClientProps {
  item: PaymentOrder
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

export function PaymentOrderEditClient({ item }: PaymentOrderEditClientProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<PaymentOrderData>({
    resolver: zodV4Resolver(paymentOrderSchema),
    defaultValues: {
      title: item.title || "",
      amount: item.amount ?? undefined,
      description: item.description || "",
      payToId: item.payTo?._id || "",
      financialUnitId: item.financialUnit?._id || "",
    },
  })

  const onSubmit = async (data: PaymentOrderData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: item._id,
          title: data.title,
          amount: data.amount,
          ...(data.description ? { description: data.description } : {}),
          payToId: data.payToId || "",
          financialUnitId: data.financialUnitId || "",
        },
        { _id: 1, title: 1, amount: 1, status: 1 }
      )
      if (result.success) {
        toast.success("دستور پرداخت با موفقیت به‌روزرسانی شد")
        router.push(`/admin/payment-orders/${item._id}`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی دستور پرداخت")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی دستور پرداخت")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({ _id: item._id })
      if (result.success) {
        toast.success("دستور پرداخت با موفقیت حذف شد")
        router.push("/admin/payment-orders")
      } else {
        toast.error(result.body?.message || "خطا در حذف دستور پرداخت")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف دستور پرداخت")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={item.title || "ویرایش دستور پرداخت"}
        description="ویرایش اطلاعات دستور پرداخت"
      >
        <Link href="/admin/payment-orders">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به دستورات پرداخت
          </Button>
        </Link>
        <Link href={`/admin/payment-orders/${item._id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            مشاهده جزئیات
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
      <HelpLauncher topicId="admin-payment-orders" tooltip="راهنمای ویرایش دستور پرداخت" />
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={ReceiptText}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="مشخصات دستور پرداخت"
          >
            <FormInput
              control={form.control}
              name="title"
              label="عنوان"
              required
              disabled={submitting}
            />
            <FormInput
              control={form.control}
              name="amount"
              label="مبلغ (ریال)"
              type="number"
              required
              disabled={submitting}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              rows={3}
              disabled={submitting}
            />
          </SectionCard>

          <SectionCard
            icon={ShoppingCart}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="درخواست خرید"
            description="درخواست خریدی که این دستور پرداخت به آن متصل است."
          >
            <div className="flex h-10 items-center gap-2 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-body-sm text-fog">
              <ShoppingCart className="size-4 shrink-0 text-fog/60" />
              {item.purchasingRequest?.title || "—"}
              <span className="ms-auto text-caption text-fog/50">درخواست خرید قابل تغییر نیست</span>
            </div>
          </SectionCard>

          <SectionCard
            icon={Store}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title="دریافت‌کننده و واحد مالی"
            description="گزینه‌های اختیاری برای مشخص کردن دریافت‌کننده وجه."
          >
            <FormSearchSelect
              control={form.control}
              name="payToId"
              label="دریافت‌کننده (فروشگاه)"
              placeholder="فروشگاه دریافت‌کننده وجه را جستجو کنید…"
              disabled={submitting}
              fetcher={payToFetcher}
            />
            <FormSearchSelect
              control={form.control}
              name="financialUnitId"
              label="واحد مالی"
              placeholder="واحد مالی مرتبط را جستجو کنید…"
              disabled={submitting}
              fetcher={financialUnitFetcher}
            />
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button type="submit" size="lg" disabled={submitting} className="flex-1 gap-2 px-5 sm:flex-none">
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
                  onClick={() => router.push(`/admin/payment-orders/${item._id}`)}
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
        title="حذف دستور پرداخت"
        description="آیا از حذف این دستور پرداخت اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
