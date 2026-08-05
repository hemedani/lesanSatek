"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Box, Loader2, Check, X, Trash2, Building2, Warehouse as WarehouseIcon, Package } from "lucide-react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { SectionCard } from "@/components/form/section-card"
import { FormInput } from "@/components/form/form-input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { update } from "@/app/actions/inventory/update"
import { remove } from "@/app/actions/inventory/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const inventorySchema = z.object({
  quantity: z.coerce.number().min(0, "مقدار نمی‌تواند منفی باشد"),
  minQuantity: z.coerce.number().optional(),
  maxQuantity: z.coerce.number().optional(),
  batchNo: z.string().optional(),
  location: z.string().optional(),
})

type InventoryData = z.infer<typeof inventorySchema>

export interface Inventory {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  expirationDate?: string
  location?: string
  unit?: { _id: string; name?: string }
  warehouseUnit?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
}

interface InventoryEditClientProps {
  item: Inventory
}

export function InventoryEditClient({ item }: InventoryEditClientProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<InventoryData>({
    resolver: zodV4Resolver(inventorySchema),
    defaultValues: {
      quantity: item.quantity ?? 0,
      minQuantity: item.minQuantity ?? undefined,
      maxQuantity: item.maxQuantity ?? undefined,
      batchNo: item.batchNo || "",
      location: item.location || "",
    },
  })

  const onSubmit = async (data: InventoryData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: item._id,
          quantity: Number(data.quantity),
          minQuantity: data.minQuantity ? Number(data.minQuantity) : undefined,
          maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : undefined,
          batchNo: data.batchNo || undefined,
          location: data.location || undefined,
        },
        { _id: 1, quantity: 1 }
      )
      if (result.success) {
        toast.success("موجودی انبار با موفقیت به‌روزرسانی شد")
        router.push(`/admin/inventory/${item._id}`)
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی موجودی انبار")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی موجودی انبار")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id })
      if (result.success) {
        toast.success("موجودی انبار با موفقیت حذف شد")
        router.push("/admin/inventory")
      } else {
        toast.error(result.body?.message || "خطا در حذف موجودی انبار")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف موجودی انبار")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={item.ware?.name || "ویرایش موجودی انبار"}
        description="ویرایش اطلاعات موجودی انبار"
      >
        <Link href="/admin/inventory">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به موجودی انبار
          </Button>
        </Link>
        <Link href={`/admin/inventory/${item._id}`}>
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
      <HelpLauncher topicId="admin-inventory" tooltip="راهنمای ویرایش موجودی انبار" />
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={Box}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="کالا و واحد"
            description="کالا و واحد مرتبط با این موجودی (قابل تغییر نیستند)."
          >
            <div className="flex h-10 items-center gap-2 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-body-sm text-fog">
              <Package className="size-4 shrink-0 text-fog/60" />
              {item.ware?.name || "—"}
            </div>
            <div className="flex h-10 items-center gap-2 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-body-sm text-fog">
              <Building2 className="size-4 shrink-0 text-fog/60" />
              {item.unit?.name || "—"}
              {item.warehouseUnit?.name ? ` · ${item.warehouseUnit.name}` : ""}
            </div>
          </SectionCard>

          <SectionCard
            icon={WarehouseIcon}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title="مقادیر موجودی"
          >
            <div className="grid grid-cols-3 gap-3">
              <FormInput
                control={form.control}
                name="quantity"
                label="موجودی"
                type="number"
                required
                disabled={submitting}
              />
              <FormInput
                control={form.control}
                name="minQuantity"
                label="حداقل"
                type="number"
                disabled={submitting}
              />
              <FormInput
                control={form.control}
                name="maxQuantity"
                label="حداکثر"
                type="number"
                disabled={submitting}
              />
            </div>
            <FormInput
              control={form.control}
              name="batchNo"
              label="شماره سریال"
              placeholder="مثال: BATCH-001"
              disabled={submitting}
            />
            <FormInput
              control={form.control}
              name="location"
              label="موقعیت"
              placeholder="مثال: قفسه A، ردیف ۳"
              disabled={submitting}
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
                  onClick={() => router.push(`/admin/inventory/${item._id}`)}
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
        title="حذف موجودی انبار"
        description="آیا از حذف این موجودی انبار اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
