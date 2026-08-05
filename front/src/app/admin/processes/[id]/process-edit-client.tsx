"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import {
  ArrowRight,
  ClipboardList,
  Activity,
  Workflow,
  List,
  Share2,
  Loader2,
  Check,
  X,
  Trash2,
  Copy,
  CheckCircle2,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormSelect } from "@/components/form/form-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { update } from "@/app/actions/process/update"
import { remove } from "@/app/actions/process/remove"
import { activateProcess } from "@/app/actions/process/activateProcess"
import { duplicateProcess } from "@/app/actions/process/duplicateProcess"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface ProcessStep {
  _id?: string
  name?: string
  description?: string
  stepType?: string
  order?: number
  required?: boolean
  groupsOperator?: string
}

export interface Process {
  _id: string
  name?: string
  description?: string
  status?: string
  version?: number
  isActive?: boolean
  createdAt?: string
  organization?: { _id: string; name?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
  unit?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareGroup?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
  steps?: ProcessStep[]
}

const processSchema = z.object({
  name: z.string().min(1, "نام فرآیند الزامی است"),
  description: z.string().optional(),
  status: z.string().min(1, "وضعیت الزامی است"),
  isActive: z.boolean(),
})

type ProcessData = z.infer<typeof processSchema>

const statusLabels: Record<string, { label: string; variant: "active" | "inactive" | "pending" | "info" }> = {
  Draft: { label: "پیش‌نویس", variant: "inactive" },
  Active: { label: "فعال", variant: "active" },
  Archived: { label: "بایگانی", variant: "pending" },
}

const statusOptions = [
  { value: "Draft", label: "پیش‌نویس" },
  { value: "Active", label: "فعال" },
  { value: "Archived", label: "بایگانی" },
]

const stepTypeLabels: Record<string, string> = {
  Approval: "تصویب",
  Review: "بررسی",
  Notification: "اطلاع‌رسانی",
  Action: "اقدام",
  Delivery: "تحویل",
  Receipt: "دریافت",
  Payment: "پرداخت",
}

const scopeChain: { key: keyof Process; label: string; className: string }[] = [
  { key: "unit", label: "واحد", className: "bg-electric-iris/8 text-electric-iris/80 border-electric-iris/15" },
  { key: "wareType", label: "نوع کالا", className: "bg-frost-link/8 text-frost-link/80 border-frost-link/15" },
  { key: "wareClass", label: "رده کالا", className: "bg-amber-400/8 text-amber-400/80 border-amber-400/15" },
  { key: "wareGroup", label: "گروه کالا", className: "bg-emerald-400/8 text-emerald-400/80 border-emerald-400/15" },
  { key: "wareModel", label: "مدل کالا", className: "bg-fog/8 text-fog/80 border-fog/15" },
  { key: "ware", label: "کالا", className: "bg-fog/8 text-fog/80 border-fog/15" },
]

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card variant="glass" className="[--card-spacing:--spacing(6)]">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div>
            <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
            {description && (
              <p className="mt-1 text-body-sm text-fog/70 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export function ProcessEditClient({ process }: { process: Process }) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<ProcessData>({
    resolver: zodV4Resolver(processSchema),
    defaultValues: {
      name: process.name || "",
      description: process.description || "",
      status: process.status || "Draft",
      isActive: process.isActive ?? true,
    },
  })

  const submitting = form.formState.isSubmitting

  const onSubmit = async (data: ProcessData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: process._id,
          name: data.name,
          description: data.description || undefined,
          status: data.status as "Draft" | "Active" | "Archived",
          isActive: data.isActive,
        },
        { _id: 1, name: 1 }
      )
      if (result.success) {
        toast.success("فرآیند با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی فرآیند")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی فرآیند")
    }
  }

  const handleActivate = async () => {
    const result = await activateProcess({
      activeRoleId: getActiveRoleIdFromStore(),
      _id: process._id,
    })
    if (result.success) {
      toast.success("فرآیند با موفقیت فعال شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در فعال‌سازی فرآیند")
    }
  }

  const handleDuplicate = async () => {
    const result = await duplicateProcess({
      activeRoleId: getActiveRoleIdFromStore(),
      _id: process._id,
      name: `${process.name || "فرآیند"} (کپی)`,
    })
    if (result.success) {
      toast.success("فرآیند با موفقیت کپی شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در کپی فرآیند")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: process._id,
      })
      if (result.success) {
        toast.success("فرآیند با موفقیت حذف شد")
        router.push("/admin/processes")
      } else {
        toast.error(result.body?.message || "خطا در حذف فرآیند")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف فرآیند")
      setDeleting(false)
    }
  }

  const steps = (process.steps || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  type ScopeKey = "unit" | "wareType" | "wareClass" | "wareGroup" | "wareModel" | "ware"
  const scopeValue = (key: ScopeKey): { name?: string } | undefined => process[key] as { name?: string } | undefined
  const activeScope = scopeChain.filter(({ key }) => scopeValue(key as ScopeKey)?.name)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={process.name || "ویرایش فرآیند"}
        description={`نسخه ${process.version || 1} · ${process.organization?.name || "بدون سازمان"}`}
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-process-edit" tooltip="راهنمای ویرایش فرآیند" />
          <Link href="/admin/processes">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به فرآیندها
            </Button>
          </Link>
          <Link href={`/admin/processes/${process._id}/steps`}>
            <Button variant="ghost" className="gap-2 px-4">
              <List className="size-5" />
              مدیریت مراحل
            </Button>
          </Link>
          {process.status === "Draft" && (
            <Button
              variant="ghost"
              onClick={handleActivate}
              className="gap-2 px-4 text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-400"
            >
              <CheckCircle2 className="size-5" />
              فعال‌سازی
            </Button>
          )}
          <Button variant="ghost" onClick={handleDuplicate} className="gap-2 px-4 text-frost-link hover:text-frost-link">
            <Copy className="size-5" />
            کپی
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowDelete(true)}
            className="gap-2 px-4 text-ember hover:bg-ember/5 hover:text-ember"
          >
            <Trash2 className="size-5" />
            حذف
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={statusLabels[process.status || ""]?.variant || "inactive"}
          label={statusLabels[process.status || ""]?.label || process.status || "—"}
        />
        <StatusBadge
          status={process.isActive ? "active" : "inactive"}
          label={process.isActive ? "فعال" : "غیرفعال"}
        />
        <span className="text-xs text-fog/50">{process.createdBy ? `ایجادکننده: ${process.createdBy.first_name} ${process.createdBy.last_name}` : ""}</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={ClipboardList}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات اصلی"
          >
            <FormInput
              control={form.control}
              name="name"
              label="نام فرآیند"
              placeholder="مثال: فرآیند خرید مستقیم"
              required
              disabled={submitting}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره فرآیند…"
              rows={3}
              disabled={submitting}
            />
          </SectionCard>

          <SectionCard
            icon={Activity}
            iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
            title="وضعیت و فعالیت"
            description="وضعیت گردش کار و فعال بودن فرآیند را مدیریت کنید."
          >
            <FormSelect
              control={form.control}
              name="status"
              label="وضعیت"
              placeholder="انتخاب وضعیت…"
              options={statusOptions}
              required
              disabled={submitting}
            />
            <FormCheckbox control={form.control} name="isActive" label="فعال" disabled={submitting} />
          </SectionCard>

          <SectionCard
            icon={Target}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="حوزه کاربرد"
            description="فرآیند به این حوزه‌ها محدود است."
          >
            {activeScope.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeScope.map(({ key, label, className }) => {
                  const value = scopeValue(key as ScopeKey)
                  return (
                    <span
                      key={key}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px]",
                        className
                      )}
                    >
                      {label}: {value?.name}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-body-sm text-fog/60">فرآیند عمومی سازمان — محدود به حوزه خاصی نیست.</p>
            )}
            <div className="border-t border-steel-border/15 pt-4">
              <Link href={`/admin/processes/${process._id}/relations`}>
                <Button variant="ghost" className="gap-2 px-4">
                  <Share2 className="size-5" />
                  ویرایش روابط
                </Button>
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            icon={Workflow}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title={`گام‌های فرآیند (${steps.length})`}
            description="گام‌های گردش کار را به ترتیب مرور یا ویرایش کنید."
          >
            {steps.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-steel-border/20 p-8 text-center">
                <Workflow className="size-8 text-fog/30" />
                <p className="text-body-sm text-fog/60">هیچ گامی تعریف نشده است</p>
              </div>
            ) : (
              <ol className="space-y-2">
                {steps.map((step, idx) => (
                  <li
                    key={step._id || idx}
                    className="flex items-start gap-4 rounded-xl border border-steel-border/15 bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-electric-iris/10 text-xs font-semibold text-electric-iris">
                        {idx + 1}
                      </span>
                      {idx < steps.length - 1 && <span className="w-px flex-1 bg-steel-border/20" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-body font-medium text-moonlight">{step.name || "گام بدون نام"}</span>
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-fog/60 border border-steel-border/20">
                          {stepTypeLabels[step.stepType || ""] || step.stepType || "—"}
                        </span>
                        {step.required && <span className="text-[10px] text-amber-400/70">ضروری</span>}
                      </div>
                      {step.description && (
                        <p className="mt-1 text-xs text-fog/50 line-clamp-2">{step.description}</p>
                      )}
                      <p className="mt-1.5 text-[10px] text-fog/40">
                        عملگر: {step.groupsOperator === "AND" ? "همه گروه‌ها" : "یکی از گروه‌ها"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
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
                  onClick={() => router.push("/admin/processes")}
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
        title="حذف فرآیند"
        description={`آیا از حذف «${process.name || "این فرآیند"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
