"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Loader2, Trash2, Check, X, CheckCircle2, Target, Copy, List, BarChart3, Share2, MapPin, ClipboardList, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { SectionCard } from "@/components/form/section-card"
import { PageHeader } from "@/components/ui/page-header"
import { Form } from "@/components/ui/form"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ErrorState } from "@/components/ui/error-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { get } from "@/app/actions/process/get"
import { update } from "@/app/actions/process/update"
import { remove } from "@/app/actions/process/remove"
import { activateProcess } from "@/app/actions/process/activateProcess"
import { duplicateProcess } from "@/app/actions/process/duplicateProcess"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { getProcessScopeChain, hasProcessScope } from "@/lib/process-scope"
import Link from "next/link"

const processSchema = z.object({
  name: z.string().min(1, "نام فرآیند الزامی است"),
  description: z.string().optional(),
})

type ProcessData = z.infer<typeof processSchema>

const statusLabels: Record<string, { label: string; variant: "active" | "inactive" | "pending" | "info" }> = {
  Draft: { label: "پیش‌نویس", variant: "inactive" },
  Active: { label: "فعال", variant: "active" },
  Archived: { label: "بایگانی", variant: "pending" },
}

const stepTypeLabels: Record<string, string> = {
  Approval: "تصویب",
  Review: "بررسی",
  Notification: "اطلاع‌رسانی",
  Action: "اقدام",
  Delivery: "تحویل",
  Receipt: "دریافت",
  Payment: "پرداخت",
}

export default function EditProcessPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [process, setProcess] = useState<any>(null)

  const form = useForm<ProcessData>({
    resolver: zodV4Resolver(processSchema),
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          description: 1,
          status: 1,
          version: 1,
          isActive: 1,
          createdAt: 1,
          organization: { _id: 1, name: 1 },
          createdBy: { _id: 1, first_name: 1, last_name: 1 },
          unit: { _id: 1, name: 1 },
          wareType: { _id: 1, name: 1 },
          wareClass: { _id: 1, name: 1 },
          wareGroup: { _id: 1, name: 1 },
          wareModel: { _id: 1, name: 1 },
          ware: { _id: 1, name: 1 },
          steps: { _id: 1, name: 1, description: 1, stepType: 1, order: 1, required: 1, groupsOperator: 1 },
        },
      )
      if (result.success && result.body?.[0]) {
        const p = result.body[0]
        setProcess(p)
        form.reset({ name: p.name || "", description: p.description || "" })
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [form, id])

  const onSubmit = async (data: ProcessData) => {
    try {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id, name: data.name, description: data.description || undefined },
        { _id: 1, name: 1 },
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

  const handleDelete = async () => {
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: id })
    if (result.success) {
      toast.success("فرآیند با موفقیت حذف شد")
      router.push("/orghead/processes")
    } else {
      toast.error(result.body?.message || "خطا در حذف فرآیند")
    }
    setShowDelete(false)
  }

  const handleActivate = async () => {
    const result = await activateProcess({ activeRoleId: getActiveRoleIdFromStore(), _id: id })
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
      _id: id,
      name: `${process?.name || "فرآیند"} (کپی)`,
    })
    if (result.success) {
      toast.success("فرآیند با موفقیت کپی شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در کپی فرآیند")
    }
  }

  if (loading) return <LoadingSkeleton type="card" count={1} />

  if (notFound) {
    return (
      <div>
        <ErrorState title="فرآیند مورد نظر یافت نشد" message="فرآیندی با این شناسه در سامانه وجود ندارد." />
        <div className="flex justify-center mt-4">
          <Link href="/orghead/processes">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const submitting = form.formState.isSubmitting

  const steps = (process?.steps || []).sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0))
  const scopeChain = hasProcessScope(process) ? getProcessScopeChain(process) : []

  const subRoutes = [
    { href: `/orghead/processes/${id}/graph`, icon: BarChart3, label: "نمودار", hint: "جریان فرآیند" },
    { href: `/orghead/processes/${id}/steps`, icon: List, label: "گام‌ها", hint: "مدیریت گام‌ها" },
    { href: `/orghead/processes/${id}/relations`, icon: Share2, label: "روابط", hint: "واحدها و مسئولین" },
  ]

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={process?.name || "ویرایش فرآیند"}
        description={`نسخه ${process?.version || 1}`}
      >
        <Link href="/orghead/processes">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به فرآیندها
          </Button>
        </Link>
        <Link href={`/orghead/processes/${id}/steps`}>
          <Button variant="ghost" className="gap-2 px-4">
            <List className="size-5" />
            مدیریت گام‌ها
          </Button>
        </Link>
        {process?.status === "Draft" && (
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
      </PageHeader>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fog/60">وضعیت:</span>
          {process?.status && (
            <StatusBadge status={statusLabels[process.status]?.variant || "inactive"} label={statusLabels[process.status]?.label || process.status} />
          )}
        </div>
        {scopeChain.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Target className="size-3.5 text-electric-iris/70" />
            {scopeChain.map((chip) => (
              <span key={chip} className="text-[11px] px-2 py-1 rounded-full bg-electric-iris/8 text-electric-iris/80 border border-electric-iris/15">
                {chip}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/[0.03] text-fog/60 border border-steel-border/15">
            حوزه کاربرد: عمومی سازمان
          </span>
        )}
        {process?.organization?.name && (
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/[0.03] text-fog/60 border border-steel-border/15 flex items-center gap-1">
            <MapPin className="size-3" />
            {process.organization.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {subRoutes.map(({ href, icon: Icon, label, hint }) => (
          <Link key={href} href={href} className="glass-card glass-card-hover-active rounded-xl p-4 flex items-center gap-3 transition-all duration-200 group">
            <div className="size-9 rounded-xl bg-electric-iris/10 border border-electric-iris/15 flex items-center justify-center shrink-0">
              <Icon className="size-4.5 text-electric-iris" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-moonlight">{label}</p>
              <p className="text-xs text-fog/50">{hint}</p>
            </div>
          </Link>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={ClipboardList}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات فرآیند"
          >
            <FormInput control={form.control} name="name" label="نام فرآیند" placeholder="مثال: فرآیند خرید مستقیم" required disabled={submitting} />
            <FormTextarea control={form.control} name="description" label="توضیحات" placeholder="توضیحات مختصری درباره فرآیند…" rows={3} disabled={submitting} />
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
                  onClick={() => router.push("/orghead/processes")}
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

      <SectionCard
        icon={Workflow}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title={`گام‌های فرآیند (${steps.length})`}
        description="گام‌های گردش کار را به ترتیب مرور یا ویرایش کنید."
      >
        {steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-steel-border/20 p-8 text-center">
            <Workflow className="size-8 text-fog/30 mx-auto mb-2" />
            <p className="text-sm text-fog/60">هیچ گامی تعریف نشده است</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {steps.map((step: any, idx: number) => (
              <div key={step._id || idx} className="relative flex items-start gap-4 rounded-lg border border-steel-border/20 bg-white/[0.02] p-4 transition-all duration-200 hover:bg-white/[0.04]">
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center justify-center size-7 rounded-full bg-electric-iris/10 text-electric-iris text-xs font-semibold">
                    {idx + 1}
                  </span>
                  {idx < steps.length - 1 && <div className="w-px flex-1 min-h-[12px] bg-steel-border/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-moonlight">{step.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-fog/60 border border-steel-border/20">
                      {stepTypeLabels[step.stepType] || step.stepType}
                    </span>
                    {step.required && <span className="text-[10px] text-amber-400/70">ضروری</span>}
                  </div>
                  {step.description && <p className="text-xs text-fog/50 mt-1">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف فرآیند"
        description="آیا از حذف این فرآیند اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  )
}