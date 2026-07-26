"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Plus, Lock, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form/form-input"
import { toast } from "sonner"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"
import { add } from "@/app/actions/fiscalYear/add"
import { close } from "@/app/actions/fiscalYear/close"

interface FiscalYearItem {
  _id: string
  name?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
  status?: string
}

const statusLabel: Record<string, string> = {
  open: "باز",
  closed: "بسته شده",
  active: "فعال",
  planning: "در برنامه‌ریزی",
}

const statusColor: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  planning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

const addSchema = z.object({
  name: z.string().min(1, "نام سال مالی الزامی است"),
  startDate: z.string().min(1, "تاریخ شروع الزامی است"),
  endDate: z.string().min(1, "تاریخ پایان الزامی است"),
})

type AddFormData = z.infer<typeof addSchema>

export default function UnitHeadFinanceFiscalYearsPage() {
  const [items, setItems] = useState<FiscalYearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<AddFormData>({
    resolver: zodV4Resolver(addSchema),
    defaultValues: { name: "", startDate: "", endDate: "" },
  })

  const fetch = useCallback(async () => {
    setLoading(true)
    const result = await getFiscalYears(
      { page: 1, limit: 50, sortBy: "startDate", sortOrder: "desc" },
      { _id: 1, name: 1, startDate: 1, endDate: 1, isActive: 1, status: 1 },
    )
    if (result.success) setItems(result.body || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleAdd = async (values: AddFormData) => {
    setSaving(true)
    try {
      const result = await add(
        {
          name: values.name,
          startDate: new Date(values.startDate),
          endDate: new Date(values.endDate),
        },
        { _id: 1, name: 1, status: 1 },
      )
      if (result.success) {
        toast.success("سال مالی با موفقیت ایجاد شد.")
        setShowAdd(false)
        form.reset()
        fetch()
      } else {
        toast.error(result.body?.message || "خطا در ایجاد سال مالی")
      }
    } catch {
      toast.error("خطا در ایجاد سال مالی")
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async () => {
    if (!closingId) return
    setSaving(true)
    try {
      const result = await close({ _id: closingId }, { _id: 1, name: 1, status: 1 })
      if (result.success) {
        toast.success("سال مالی با موفقیت بسته شد.")
        setClosingId(null)
        fetch()
      } else {
        toast.error(result.body?.message || "خطا در بستن سال مالی")
      }
    } catch {
      toast.error("خطا در بستن سال مالی")
    } finally {
      setSaving(false)
    }
  }

  const canClose = (item: FiscalYearItem) =>
    item.status !== "closed" && item.isActive !== false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="سال‌های مالی" description="مدیریت سال‌های مالی سازمان" />
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="size-4" />
          سال جدید
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-moonlight" />
        </div>
      ) : items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Calendar} title="سال مالی یافت نشد" description="هنوز هیچ سال مالی ثبت نشده است." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item._id} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
                      <Calendar className="size-5 text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-frost-link">
                        {item.name || "—"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {item.startDate && (
                          <span className="text-xs text-fog/50">
                            از {new Date(item.startDate).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                        {item.endDate && (
                          <span className="text-xs text-fog/50">
                            تا {new Date(item.endDate).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 font-medium ${statusColor[item.status || ""] || ""}`}>
                      {statusLabel[item.status || ""] || item.status || "—"}
                    </Badge>
                    {canClose(item) && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-amber-400 border-amber-400/30 hover:bg-amber-400/10" onClick={() => setClosingId(item._id)}>
                        <Lock className="size-3.5" />
                        بستن
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>سال مالی جدید</DialogTitle>
            <DialogDescription>اطلاعات سال مالی جدید را وارد کنید.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4">
              <FormInput control={form.control} name="name" label="نام سال مالی" placeholder="مثال: سال مالی ۱۴۰۶" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput control={form.control} name="startDate" label="تاریخ شروع" type="date" required />
                <FormInput control={form.control} name="endDate" label="تاریخ پایان" type="date" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>
                  انصراف
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {saving ? "در حال ذخیره..." : "ایجاد"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Close Confirm */}
      <ConfirmDialog
        open={!!closingId}
        onOpenChange={(open) => { if (!open) setClosingId(null) }}
        title="بستن سال مالی"
        description="آیا از بستن این سال مالی اطمینان دارید؟ پس از بستن، امکان تغییر در بودجه‌های آن وجود نخواهد داشت."
        confirmLabel={saving ? "در حال بستن..." : "بستن سال مالی"}
        onConfirm={handleClose}
        variant="destructive"
      />
    </div>
  )
}
