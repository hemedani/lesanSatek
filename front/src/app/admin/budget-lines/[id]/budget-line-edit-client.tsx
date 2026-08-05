"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Wallet, Loader2, Check, X, Trash2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form/form-input"
import { SectionCard } from "@/components/form/section-card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { update } from "@/app/actions/budgetLine/update"
import { remove } from "@/app/actions/budgetLine/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const blSchema = z.object({
  code: z.string().min(1, "کد ردیف بودجه الزامی است"),
  title: z.string().min(1, "عنوان ردیف بودجه الزامی است"),
  description: z.string().optional(),
  totalAllocated: z.string().optional(),
  totalEncumbered: z.string().optional(),
  totalSpent: z.string().optional(),
})

type BudgetLineData = z.infer<typeof blSchema>

interface BudgetLineEditClientProps {
  budgetLine: {
    _id: string
    code?: string
    title?: string
    description?: string
    totalAllocated?: number
    totalEncumbered?: number
    totalSpent?: number
    remainingBudget?: number
    fiscalYear?: { _id: string; name?: string }
    organization?: { _id: string; name?: string }
    unit?: { _id: string; name?: string }
    wareType?: { _id: string; name?: string }
  }
}

export function BudgetLineEditClient({ budgetLine }: BudgetLineEditClientProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<BudgetLineData>({
    resolver: zodV4Resolver(blSchema),
    defaultValues: {
      code: budgetLine.code || "",
      title: budgetLine.title || "",
      description: budgetLine.description || "",
      totalAllocated: budgetLine.totalAllocated != null ? String(budgetLine.totalAllocated) : "",
      totalEncumbered: budgetLine.totalEncumbered != null ? String(budgetLine.totalEncumbered) : "",
      totalSpent: budgetLine.totalSpent != null ? String(budgetLine.totalSpent) : "",
    },
  })

  const onSubmit = async (data: BudgetLineData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: budgetLine._id,
          code: data.code,
          title: data.title,
          ...(data.description ? { description: data.description } : {}),
          ...(data.totalAllocated ? { totalAllocated: Number(data.totalAllocated) } : {}),
          ...(data.totalEncumbered ? { totalEncumbered: Number(data.totalEncumbered) } : {}),
          ...(data.totalSpent ? { totalSpent: Number(data.totalSpent) } : {}),
        },
        { _id: 1, code: 1, title: 1 },
      )
      if (result.success) {
        toast.success("ردیف بودجه با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی ردیف بودجه")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی ردیف بودجه")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({ _id: budgetLine._id })
      if (result.success) {
        toast.success("ردیف بودجه با موفقیت حذف شد")
        router.push("/admin/budget-lines")
      } else {
        toast.error(result.body?.message || "خطا در حذف ردیف بودجه")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف ردیف بودجه")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={budgetLine.title || budgetLine.code || "ویرایش ردیف بودجه"}
        description="ویرایش اطلاعات ردیف بودجه"
      >
        <Link href="/admin/budget-lines">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به ردیف‌های بودجه
          </Button>
        </Link>
        <Link href={`/admin/budget-lines/${budgetLine._id}/relations`}>
          <Button variant="ghost" className="gap-2 px-4">
            <Share2 className="size-5" />
            ویرایش روابط
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
      <HelpLauncher topicId="admin-budget-lines" tooltip="راهنمای ردیف بودجه" />
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={Wallet}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="مشخصات ردیف بودجه"
          >
            <FormInput control={form.control} name="code" label="کد ردیف بودجه" required disabled={submitting} />
            <FormInput control={form.control} name="title" label="عنوان" required disabled={submitting} />
            <FormInput control={form.control} name="description" label="توضیحات" disabled={submitting} />
          </SectionCard>

          <SectionCard
            icon={Wallet}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="مبالغ"
            description="مانده ردیف پس از ذخیره به‌صورت خودکار محاسبه می‌شود."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormInput control={form.control} name="totalAllocated" label="تخصیص یافته (ریال)" type="number" disabled={submitting} />
              <FormInput control={form.control} name="totalEncumbered" label="تعهد شده (ریال)" type="number" disabled={submitting} />
              <FormInput control={form.control} name="totalSpent" label="مصرف شده (ریال)" type="number" disabled={submitting} />
            </div>
          </SectionCard>

          <SectionCard
            icon={Wallet}
            iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
            title="سازمان و سال مالی"
            description="برای تغییر سازمان، سال مالی، واحد و نوع کالا از دکمه «ویرایش روابط» استفاده کنید."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2.5">
                <p className="text-caption text-fog/60">سازمان</p>
                <p className="mt-0.5 text-body-sm font-medium text-moonlight">{budgetLine.organization?.name || "—"}</p>
              </div>
              <div className="rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2.5">
                <p className="text-caption text-fog/60">سال مالی</p>
                <p className="mt-0.5 text-body-sm font-medium text-moonlight">{budgetLine.fiscalYear?.name || "—"}</p>
              </div>
              <div className="rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2.5">
                <p className="text-caption text-fog/60">واحد</p>
                <p className="mt-0.5 text-body-sm font-medium text-moonlight">{budgetLine.unit?.name || "—"}</p>
              </div>
              <div className="rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2.5">
                <p className="text-caption text-fog/60">نوع کالا</p>
                <p className="mt-0.5 text-body-sm font-medium text-moonlight">{budgetLine.wareType?.name || "—"}</p>
              </div>
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
                  onClick={() => router.push("/admin/budget-lines")}
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
        title="حذف ردیف بودجه"
        description="آیا از حذف این ردیف بودجه اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
