"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Workflow, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSection } from "@/components/form/form-section"
import { Form } from "@/components/ui/form"
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
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 border border-electric-iris/20">
            <Workflow className="size-5 text-electric-iris" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              فرآیند جدید
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              ایجاد فرآیند خرید جدید. گام‌های فرآیند را به ترتیب تعریف کنید.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormSection title="اطلاعات فرآیند" description="نام، توضیحات و حوزه کاربرد">
            <FormInput control={form.control} name="name" label="نام فرآیند" placeholder="مثال: فرآیند خرید مستقیم" required disabled={form.formState.isSubmitting} />
            <FormTextarea control={form.control} name="description" label="توضیحات" placeholder="توضیحات مختصری درباره فرآیند..." rows={3} disabled={form.formState.isSubmitting} />
          </FormSection>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Target className="size-4.5 text-electric-iris" />
                </div>
                <div>
                  <CardTitle className="text-glacier">حوزه کاربرد فرآیند</CardTitle>
                  <p className="text-sm text-fog/70 leading-relaxed mt-1">
                    فرآیند را به یک واحد یا سطحی از سلسله‌مراتب کالا محدود کنید. در صورت عدم انتخاب، فرآیند عمومی سازمان خواهد بود. انتخاب هر سطح، سطوح پایین‌تر را به صورت هوشمند فیلتر می‌کند.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProcessScopeFields form={form} disabled={form.formState.isSubmitting} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              گام‌های فرآیند
            </h2>
            <ProcessBuilder
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              control={form.control as any}
              disabled={form.formState.isSubmitting}
            />
          </div>

          <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <Link href="/orghead/processes">
              <Button type="button" variant="ghost" disabled={form.formState.isSubmitting}>
                انصراف
              </Button>
            </Link>
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5 min-w-[140px]">
              {form.formState.isSubmitting ? (
                <><Loader2 className="size-4 animate-spin" /> در حال ایجاد...</>
              ) : "ایجاد فرآیند"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
