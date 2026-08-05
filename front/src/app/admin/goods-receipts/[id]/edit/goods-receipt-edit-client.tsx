"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, useFieldArray } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, ClipboardList, Loader2, Check, X, Trash2, ShoppingCart, Package, StickyNote, Plus } from "lucide-react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SectionCard } from "@/components/form/section-card"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { update } from "@/app/actions/goodsReceipt/update"
import { remove as removeReceipt } from "@/app/actions/goodsReceipt/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { gets as getWareModels } from "@/app/actions/wareModel/gets"

const itemSchema = z.object({
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
  quantityReceived: z.coerce.number().min(1, "تعداد دریافت شده باید حداقل ۱ باشد"),
  quantityAccepted: z.coerce.number().min(0, "تعداد قبول شده نمی‌تواند منفی باشد"),
  quantityRejected: z.coerce.number().min(0, "تعداد رد شده نمی‌تواند منفی باشد"),
  batchNo: z.string().optional(),
  expirationDate: z.string().optional(),
})

const goodsReceiptSchema = z.object({
  receiptNumber: z.string().min(1, "شماره رسید الزامی است"),
  description: z.string().optional(),
  notes: z.string().optional(),
  receivedAt: z.string().min(1, "تاریخ رسید الزامی است"),
  receivedAtTime: z.string().optional(),
  items: z.array(itemSchema).min(1, "حداقل یک آیتم کالا باید وارد شود"),
})

type GoodsReceiptData = z.infer<typeof goodsReceiptSchema>

interface GoodsReceiptItem {
  _id?: string
  wareModelId?: string
  wareModelName?: string
  wareName?: string
  quantityReceived?: number
  quantityAccepted?: number
  quantityRejected?: number
  batchNo?: string
  expirationDate?: string
}

export interface GoodsReceipt {
  _id: string
  receiptNumber?: string
  description?: string
  receivedAt?: string
  status?: string
  notes?: string
  items?: GoodsReceiptItem[]
  purchasingRequest?: { _id: string; title?: string }
}

interface GoodsReceiptEditClientProps {
  receipt: GoodsReceipt
}

const wareModelsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareModels(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((w) => ({
    _id: w._id,
    name: w.name || "",
  }))
}

export function GoodsReceiptEditClient({ receipt }: GoodsReceiptEditClientProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const receivedAt = receipt.receivedAt ? new Date(receipt.receivedAt) : new Date()

  const form = useForm<GoodsReceiptData>({
    resolver: zodV4Resolver(goodsReceiptSchema),
    defaultValues: {
      receiptNumber: receipt.receiptNumber || "",
      description: receipt.description || "",
      notes: receipt.notes || "",
      receivedAt: receivedAt.toISOString(),
      receivedAtTime: receivedAt.toTimeString().slice(0, 5),
      items: receipt.items && receipt.items.length > 0
        ? receipt.items.map((item) => ({
            wareModelId: item.wareModelId || "",
            quantityReceived: item.quantityReceived || 1,
            quantityAccepted: item.quantityAccepted ?? 0,
            quantityRejected: item.quantityRejected ?? 0,
            batchNo: item.batchNo || "",
            expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString() : "",
          }))
        : [{
            wareModelId: "",
            quantityReceived: 1,
            quantityAccepted: 1,
            quantityRejected: 0,
            batchNo: "",
            expirationDate: "",
          }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const items = form.watch("items")

  const onSubmit = async (values: GoodsReceiptData) => {
    try {
      const [h, m] = (values.receivedAtTime || "00:00").split(":").map(Number)
      const receivedDate = new Date(values.receivedAt)
      receivedDate.setHours(h || 0, m || 0)
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: receipt._id,
          receiptNumber: values.receiptNumber,
          description: values.description || undefined,
          receivedAt: receivedDate,
          notes: values.notes || undefined,
          items: values.items.map((item) => ({
            wareModelId: item.wareModelId,
            quantityReceived: item.quantityReceived,
            quantityAccepted: item.quantityAccepted,
            quantityRejected: item.quantityRejected,
            batchNo: item.batchNo || undefined,
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
          })),
        },
        { _id: 1, receiptNumber: 1, status: 1 }
      )
      if (result.success) {
        toast.success("رسید کالا با موفقیت به‌روزرسانی شد")
        router.push(`/admin/goods-receipts/${receipt._id}`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی رسید کالا")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی رسید کالا")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await removeReceipt({ _id: receipt._id })
      if (result.success) {
        toast.success("رسید کالا با موفقیت حذف شد")
        router.push("/admin/goods-receipts")
      } else {
        toast.error(result.body?.message || "خطا در حذف رسید کالا")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف رسید کالا")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={receipt.receiptNumber || "ویرایش رسید کالا"}
        description="ویرایش اطلاعات رسید کالا"
      >
        <Link href="/admin/goods-receipts">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به رسیدها
          </Button>
        </Link>
        <Link href={`/admin/goods-receipts/${receipt._id}`}>
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
      <HelpLauncher topicId="admin-goods-receipts" tooltip="راهنمای ویرایش رسید کالا" />
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={ClipboardList}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="مشخصات رسید"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormInput
                control={form.control}
                name="receiptNumber"
                label="شماره رسید"
                required
                disabled={submitting}
              />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <FormJalaliDatePicker
                    control={form.control}
                    name="receivedAt"
                    label="تاریخ رسید"
                    required
                    disabled={submitting}
                  />
                </div>
                <FormInput control={form.control} name="receivedAtTime" label="ساعت" type="time" disabled={submitting} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={ShoppingCart}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="درخواست خرید"
            description="درخواست خریدی که این رسید به آن متصل است."
          >
            <div className="flex h-10 items-center gap-2 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-body-sm text-fog">
              <ShoppingCart className="size-4 shrink-0 text-fog/60" />
              {receipt.purchasingRequest?.title || "—"}
              <span className="ms-auto text-caption text-fog/50">درخواست خرید قابل تغییر نیست</span>
            </div>
          </SectionCard>

          <SectionCard
            icon={Package}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title="آیتم‌های کالا"
            description="کالاهای دریافت شده در این رسید."
          >
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg border border-steel-border/20 bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-fog/50">کالای {index + 1}</span>
                    {index > 0 && (
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} className="size-6 text-rose-400 hover:text-rose-300">
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormSearchSelect
                      control={form.control}
                      name={`items.${index}.wareModelId`}
                      label="مدل کالا"
                      placeholder="جستجوی کالا..."
                      required
                      disabled={submitting}
                      fetcher={wareModelsFetcher}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <FormInput control={form.control} name={`items.${index}.quantityReceived`} label="تعداد دریافت" type="number" required disabled={submitting} />
                      <FormInput control={form.control} name={`items.${index}.quantityAccepted`} label="قبول شده" type="number" required disabled={submitting} />
                      <FormInput control={form.control} name={`items.${index}.quantityRejected`} label="رد شده" type="number" required disabled={submitting} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormInput control={form.control} name={`items.${index}.batchNo`} label="شماره بچ" placeholder="مثال: BATCH-۰۰۱" disabled={submitting} />
                    <FormJalaliDatePicker control={form.control} name={`items.${index}.expirationDate`} label="تاریخ انقضا" disabled={submitting} />
                  </div>
                  {items?.[index] && (
                    <div className="flex items-center gap-4 text-xs text-fog/50">
                      <span>دریافتی: {items[index].quantityReceived || 0}</span>
                      <span>قبول: {items[index].quantityAccepted || 0}</span>
                      <span>رد: {items[index].quantityRejected || 0}</span>
                    </div>
                  )}
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-center text-fog/50 py-4">هیچ کالایی اضافه نشده است. از دکمه «افزودن کالا» استفاده کنید.</p>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => append({ wareModelId: "", quantityReceived: 1, quantityAccepted: 1, quantityRejected: 0, batchNo: "", expirationDate: "" })}
                className="gap-1"
              >
                <Plus className="size-3.5" />
                افزودن کالا
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            icon={StickyNote}
            iconClassName="bg-white/[0.03] text-fog ring-steel-border/20"
            title="توضیحات و یادداشت‌ها"
          >
            <FormTextarea control={form.control} name="description" label="توضیحات" rows={2} disabled={submitting} />
            <FormTextarea control={form.control} name="notes" label="یادداشت‌ها" rows={2} disabled={submitting} />
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
                  onClick={() => router.push(`/admin/goods-receipts/${receipt._id}`)}
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
        title="حذف رسید کالا"
        description="آیا از حذف این رسید کالا اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
