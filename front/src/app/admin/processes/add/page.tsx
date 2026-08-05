"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, ClipboardList, GitBranch, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { ProcessBuilder } from "@/components/process/process-builder"
import { ProcessScopeFields } from "@/components/process/process-scope-fields"
import { add as addProcess } from "@/app/actions/process/add"
import { add as addStep } from "@/app/actions/processStep/add"
import { count as countProcesses } from "@/app/actions/process/count"
import { gets as getOrgs } from "@/app/actions/organization/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const assigneeGroupSchema = z.object({
  operator: z.string(),
  unitId: z.string().optional(),
})

const stepSchema = z.object({
  name: z.string().min(1, "نام گام الزامی است"),
  description: z.string().optional(),
  stepType: z.string(),
  order: z.number(),
  required: z.boolean(),
  groupsOperator: z.string(),
  assigneeGroups: z.array(assigneeGroupSchema),
})

const processSchema = z.object({
  name: z.string().min(1, "نام فرآیند الزامی است"),
  description: z.string().optional(),
  organizationId: z.string().min(1, "سازمان الزامی است"),
  unitId: z.string().optional(),
  wareTypeId: z.string().optional(),
  wareClassId: z.string().optional(),
  wareGroupId: z.string().optional(),
  wareModelId: z.string().optional(),
  wareId: z.string().optional(),
  steps: z.array(stepSchema),
})

type ProcessData = z.infer<typeof processSchema>

const checkScopeConflict = async (
  organizationId: string,
  scope: Pick<ProcessData, "unitId" | "wareTypeId" | "wareClassId" | "wareGroupId" | "wareModelId" | "wareId">
): Promise<string | null> => {
  const scopeFilter: Record<string, string> = { organizationId }
  for (const key of ["unitId", "wareTypeId", "wareClassId", "wareGroupId", "wareModelId", "wareId"] as const) {
    if (scope[key]) scopeFilter[key] = scope[key]
  }
  if (Object.keys(scopeFilter).length === 1) return null

  for (const status of ["Active", "Draft"] as const) {
    const result = await countProcesses({ status, ...scopeFilter } as Parameters<typeof countProcesses>[0])
    const qty = result.success ? result.body?.qty : 0
    if (qty > 0) {
      return status === "Active"
        ? "یک فرآیند فعال با همین حوزه کاربرد وجود دارد. ابتدا آن را غیرفعال یا بایگانی کنید."
        : "یک فرآیند پیش‌نویس با همین حوزه کاربرد وجود دارد. حوزه کاربرد را تغییر دهید یا فرآیند قبلی را تکمیل کنید."
    }
  }
  return null
}

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

export default function AddProcessPage() {
  const router = useRouter()
  const form = useForm<ProcessData>({
    resolver: zodV4Resolver(processSchema),
    defaultValues: {
      name: "",
      description: "",
      organizationId: "",
      unitId: "",
      wareTypeId: "",
      wareClassId: "",
      wareGroupId: "",
      wareModelId: "",
      wareId: "",
      steps: [],
    },
  })

  const submitting = form.formState.isSubmitting

  const onSubmit = async (data: ProcessData) => {
    const conflict = await checkScopeConflict(data.organizationId, data)
    if (conflict) {
      toast.error(conflict)
      return
    }

    const result = await addProcess(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        name: data.name,
        description: data.description || undefined,
        status: "Draft",
        version: 1,
        isActive: true,
        organizationId: data.organizationId,
        ...(data.unitId ? { unitId: data.unitId } : {}),
        ...(data.wareTypeId ? { wareTypeId: data.wareTypeId } : {}),
        ...(data.wareClassId ? { wareClassId: data.wareClassId } : {}),
        ...(data.wareGroupId ? { wareGroupId: data.wareGroupId } : {}),
        ...(data.wareModelId ? { wareModelId: data.wareModelId } : {}),
        ...(data.wareId ? { wareId: data.wareId } : {}),
      },
      { _id: 1, name: 1 }
    )

    if (!result.success) {
      toast.error(result.body?.message || "خطا در ایجاد فرآیند")
      return
    }

    const processId = result.body?._id
    if (!processId) {
      toast.error("شناسه فرآیند دریافت نشد")
      return
    }

    if (data.steps.length > 0) {
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i]
        const assigneeGroups = step.assigneeGroups
          .filter((g) => g.unitId)
          .map((g) => ({
            operator: g.operator as "AND" | "OR",
            unitIds: [g.unitId as string],
          }))

        const stepResult = await addStep(
          {
            activeRoleId: getActiveRoleIdFromStore(),
            name: step.name,
            description: step.description || undefined,
            stepType: step.stepType as "Approval" | "Review" | "Notification" | "Action" | "Delivery" | "Receipt" | "Payment",
            order: i + 1,
            required: step.required,
            groupsOperator: step.groupsOperator as "AND" | "OR",
            assigneeGroups: assigneeGroups.length > 0 ? assigneeGroups : [{ operator: "AND", unitIds: [] }],
            processId,
          },
          { _id: 1, name: 1 }
        )

        if (!stepResult.success) {
          toast.error(`خطا در ایجاد گام ${i + 1}: ${stepResult.body?.message || "خطا"}`)
          return
        }
      }
    }

    toast.success("فرآیند با موفقیت ایجاد شد")
    router.push("/admin/processes")
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="افزودن فرآیند"
        description="اطلاعات اولیه فرآیند را وارد کنید؛ پس از ایجاد، می‌توانید گام‌های گردش کار را تعریف کنید."
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-process-add" tooltip="راهنمای ایجاد فرآیند" />
          <Link href="/admin/processes">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به فرآیندها
            </Button>
          </Link>
        </div>
      </PageHeader>

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
            icon={GitBranch}
            iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
            title="سازمان و حوزه کاربرد"
            description="فرآیند را به سازمان و در صورت نیاز به یک واحد یا سطح خاصی از سلسله‌مراتب کالا محدود کنید. در صورت عدم انتخاب حوزه، فرآیند عمومی سازمان خواهد بود."
          >
            <FormSearchSelect
              control={form.control}
              name="organizationId"
              label="سازمان"
              placeholder="انتخاب سازمان…"
              required
              disabled={submitting}
              fetcher={async (search?: string) => {
                const result = await getOrgs(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, name: 1 }
                )
                if (!result.success || !result.body) return []
                return result.body.map((o: { _id?: string; name?: string }) => ({
                  _id: o._id || "",
                  name: o.name || "",
                }))
              }}
            />
            <ProcessScopeFields form={form} disabled={submitting} />
          </SectionCard>

          <Card variant="glass" className="[--card-spacing:--spacing(6)]">
            <CardContent className="space-y-5">
              <ProcessBuilder
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                control={form.control as any}
                disabled={submitting}
              />
            </CardContent>
          </Card>

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
                  ثبت فرآیند
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
    </div>
  )
}
