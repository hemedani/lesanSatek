"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Gavel, Loader2, Check, X, Trash2, ShoppingCart } from "lucide-react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SectionCard } from "@/components/form/section-card"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { update } from "@/app/actions/tender/update"
import { remove } from "@/app/actions/tender/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const tenderSchema = z.object({
  title: z.string().min(1, "عنوان مناقصه الزامی است"),
  description: z.string().optional(),
  deadline: z.string().min(1, "مهلت ارسال پیشنهاد الزامی است"),
})

type TenderData = z.infer<typeof tenderSchema>

export interface Tender {
  _id: string
  title?: string
  description?: string
  status?: string
  deadline?: string
  purchasingRequest?: { _id: string; title?: string }
}

interface TenderEditClientProps {
  tender: Tender
}

export function TenderEditClient({ tender }: TenderEditClientProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<TenderData>({
    resolver: zodV4Resolver(tenderSchema),
    defaultValues: {
      title: tender.title || "",
      description: tender.description || "",
      deadline: tender.deadline ? new Date(tender.deadline).toISOString() : "",
    },
  })

  const onSubmit = async (data: TenderData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: tender._id,
          title: data.title,
          ...(data.description ? { description: data.description } : {}),
          deadline: new Date(data.deadline),
        },
        { _id: 1, title: 1, status: 1 }
      )
      if (result.success) {
        toast.success("مناقصه با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی مناقصه")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی مناقصه")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: tender._id,
      })
      if (result.success) {
        toast.success("مناقصه با موفقیت حذف شد")
        router.push("/admin/tenders")
      } else {
        toast.error(result.body?.message || "خطا در حذف مناقصه")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف مناقصه")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={tender.title || "ویرایش مناقصه"}
        description="ویرایش اطلاعات مناقصه"
      >
        <Link href="/admin/tenders">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به مناقصات
          </Button>
        </Link>
        <Link href={`/admin/tenders/${tender._id}`}>
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
      <HelpLauncher topicId="admin-tenders" tooltip="راهنمای ویرایش مناقصه" />
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={Gavel}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="مشخصات مناقصه"
          >
            <FormInput
              control={form.control}
              name="title"
              label="عنوان مناقصه"
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
            <FormJalaliDatePicker
              control={form.control}
              name="deadline"
              label="مهلت ارسال پیشنهاد"
              required
              disabled={submitting}
            />
          </SectionCard>

          <SectionCard
            icon={ShoppingCart}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="درخواست خرید"
            description="درخواست خریدی که این مناقصه به آن متصل است."
          >
            <div className="flex h-10 items-center gap-2 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-body-sm text-fog">
              <ShoppingCart className="size-4 shrink-0 text-fog/60" />
              {tender.purchasingRequest?.title || "—"}
              <span className="ms-auto text-caption text-fog/50">درخواست خرید قابل تغییر نیست</span>
            </div>
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
                  onClick={() => router.push("/admin/tenders")}
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
        title="حذف مناقصه"
        description="آیا از حذف این مناقصه اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}