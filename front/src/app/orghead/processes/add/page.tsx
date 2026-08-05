"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, ClipboardList, Loader2, Check, X, GitBranch, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { SectionCard } from "@/components/form/section-card"
import { Form } from "@/components/ui/form"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { ProcessBuilder } from "@/components/process/process-builder"
import { ProcessScopeFields } from "@/components/process/process-scope-fields"
import { add as addProcess } from "@/app/actions/process/add"
import { add as addStep } from "@/app/actions/processStep/add"
import { count as countProcesses } from "@/app/actions/process/count"
import Link from "next/link"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { useAuthStore } from "@/stores/authStore"

const stepSchema = z.object({
  name: z.string().min(1, "نام گام الزامی است"),
  description: z.string().optional(),
  stepType: z.string(),
  order: z.number(),
  required: z.boolean(),
  groupsOperator: z.string(),
  assigneeGroups: z.array(z.object({ operator: z.string(), unitId: z.string().optional() })),
})

const processSchema = z.object({
  name: z.string().min(1, "نام فرآیند الزامی است"),
  description: z.string().optional(),
  unitId: z.string().optional(),
  wareTypeId: z.string().optional(),
  wareClassId: z.string().optional(),
  wareGroupId: z.string().optional(),
  wareModelId: z.string().optional(),
  wareId: z.string().optional(),
  steps: z.array(stepSchema),
})

type ProcessData = z.infer<typeof processSchema>

const checkScopeConflict = async (scope: Pick<ProcessData, "unitId" | "wareTypeId" | "wareClassId" | "wareGroupId" | "wareModelId" | "wareId">): Promise<string | null> => {
  const scopeFilter: Record<string, string> = {}
  for (const key of ["unitId", "wareTypeId", "wareClassId", "wareGroupId", "wareModelId", "wareId"] as const) {
    if (scope[key]) scopeFilter[key] = scope[key]
  }
  if (Object.keys(scopeFilter).length === 0) return null

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

export default function AddProcessPage() {
  const router = useRouter()
  const form = useForm<ProcessData>({
    resolver: zodV4Resolver(processSchema),
    defaultValues: {
      name: "",
      description: "",
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
    const scope = useAuthStore.getState().getActiveScope();
    const organizationId = scope?.type === "organization" ? scope.id : "";

    const conflict = await checkScopeConflict(data)
    if (conflict) {
      toast.error(conflict)
      return
    }

    const result = await addProcess(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        organizationId,
        name: data.name,
        description: data.description || undefined,
        status: "Draft",
        version: 1,
        isActive: true,
        ...(data.unitId ? { unitId: data.unitId } : {}),
        ...(data.wareTypeId ? { wareTypeId: data.wareTypeId } : {}),
        ...(data.wareClassId ? { wareClassId: data.wareClassId } : {}),
        ...(data.wareGroupId ? { wareGroupId: data.wareGroupId } : {}),
        ...(data.wareModelId ? { wareModelId: data.wareModelId } : {}),
        ...(data.wareId ? { wareId: data.wareId } : {}),
      },
      { _id: 1, name: 1 },
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
          .map((g) => ({ operator: g.operator as "AND" | "OR", unitIds: [g.unitId as string] }))

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
          { _id: 1, name: 1 },
        )

        if (!stepResult.success) {
          toast.error(`خطا در ایجاد گام ${i + 1}: ${stepResult.body?.message || "خطا"}`)
          return
        }
      }
    }

    toast.success("فرآیند با موفقیت ایجاد شد")
    router.push("/orghead/processes")
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="افزودن فرآیند"
        description="اطلاعات اولیه فرآیند را وارد کنید؛ گام‌های گردش کار را به ترتیب تعریف کنید."
      >
        <Link href="/orghead/processes">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به فرآیندها
          </Button>
        </Link>
        <HelpLauncher topicId="orghead-process-add" tooltip="راهنمای ایجاد فرآیند" />
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
            title="حوزه کاربرد فرآیند"
            description="فرآیند را به یک واحد یا سطحی از سلسله‌مراتب کالا محدود کنید. در صورت عدم انتخاب، فرآیند عمومی سازمان خواهد بود. انتخاب هر سطح، سطوح پایین‌تر را به صورت هوشمند فیلتر می‌کند."
          >
            <ProcessScopeFields form={form} disabled={submitting} />
          </SectionCard>

          <SectionCard
            icon={Workflow}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="گام‌های فرآیند"
            description="گام‌های گردش کار را به ترتیب تعریف کنید."
          >
            <ProcessBuilder
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              control={form.control as any}
              disabled={submitting}
            />
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
                  ثبت فرآیند
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
    </div>
  )
}
