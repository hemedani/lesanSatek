"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Trash2, Workflow, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { update as updateStep } from "@/app/actions/processStep/update"
import { remove as removeStep } from "@/app/actions/processStep/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface InspectorStep {
  _id?: string
  name?: string
  description?: string
  stepType?: string
  order?: number
  required?: boolean
  groupsOperator?: string
  assigneeGroups?: { operator?: string; unitIds?: string[] }[]
}

const stepTypeOptions = [
  { value: "Approval", label: "تصویب" },
  { value: "Review", label: "بررسی" },
  { value: "Notification", label: "اطلاع‌رسانی" },
  { value: "Action", label: "اقدام" },
  { value: "Delivery", label: "تحویل" },
  { value: "Receipt", label: "دریافت" },
  { value: "Payment", label: "پرداخت" },
]

const groupOperatorOptions = [
  { value: "AND", label: "همه گروه‌ها (AND)" },
  { value: "OR", label: "یکی از گروه‌ها (OR)" },
]

const innerOperatorOptions = [
  { value: "AND", label: "همه واحدها (AND)" },
  { value: "OR", label: "یکی از واحدها (OR)" },
]

const assigneeGroupSchema = z.object({
  operator: z.string(),
  unitId: z.string().optional(),
})

const stepSchema = z.object({
  name: z.string().min(1, "نام گام الزامی است"),
  description: z.string().optional(),
  stepType: z.string().min(1, "نوع گام الزامی است"),
  required: z.boolean(),
  groupsOperator: z.string(),
  assigneeGroups: z.array(assigneeGroupSchema),
})

type StepData = z.infer<typeof stepSchema>

const stepTypeLabels: Record<string, string> = {
  Approval: "تصویب",
  Review: "بررسی",
  Notification: "اطلاع‌رسانی",
  Action: "اقدام",
  Delivery: "تحویل",
  Receipt: "دریافت",
  Payment: "پرداخت",
}

interface ProcessStepInspectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  step: InspectorStep | null
  onSaved: () => void
}

export function ProcessStepInspector({
  open,
  onOpenChange,
  step,
  onSaved,
}: ProcessStepInspectorProps) {
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const form = useForm<StepData>({
    resolver: zodV4Resolver(stepSchema),
    defaultValues: {
      name: "",
      description: "",
      stepType: "Approval",
      required: true,
      groupsOperator: "AND",
      assigneeGroups: [],
    },
  })

  const groupsArrayName = "assigneeGroups"
  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control: form.control,
    name: groupsArrayName,
  })

  useEffect(() => {
    if (open && step) {
      form.reset({
        name: step.name || "",
        description: step.description || "",
        stepType: step.stepType || "Approval",
        required: step.required ?? true,
        groupsOperator: step.groupsOperator || "AND",
        assigneeGroups:
          (step.assigneeGroups || []).map((g) => ({
            operator: g.operator || "AND",
            unitId: g.unitIds?.[0] || "",
          })) || [],
      })
    }
  }, [open, step, form])

  const submitting = form.formState.isSubmitting

  const onSubmit = async (data: StepData) => {
    if (!step?._id) return
    const result = await updateStep(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: step._id,
        name: data.name,
        description: data.description || undefined,
        stepType: data.stepType as "Approval" | "Review" | "Notification" | "Action" | "Delivery" | "Receipt" | "Payment",
        required: data.required,
        groupsOperator: data.groupsOperator as "AND" | "OR",
        assigneeGroups:
          data.assigneeGroups.length > 0
            ? data.assigneeGroups.map((g) => ({
                operator: g.operator as "AND" | "OR",
                unitIds: g.unitId ? [g.unitId] : [],
              }))
            : [{ operator: "AND" as const, unitIds: [] }],
      },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("گام با موفقیت به‌روزرسانی شد")
      onSaved()
      onOpenChange(false)
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی گام")
    }
  }

  const handleDelete = async () => {
    if (!step?._id) return
    setDeleting(true)
    const result = await removeStep({
      activeRoleId: getActiveRoleIdFromStore(),
      _id: step._id,
    })
    if (result.success) {
      toast.success("گام با موفقیت حذف شد")
      onSaved()
      onOpenChange(false)
    } else {
      toast.error(result.body?.message || "خطا در حذف گام")
      setDeleting(false)
    }
    setShowDelete(false)
  }

  const stepTypeIcon = stepTypeLabels[step?.stepType || ""]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                <Workflow className="size-5 text-electric-iris" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-moonlight">
                  ویرایش گام {step?.order || ""}
                </DialogTitle>
                <DialogDescription className="mt-1.5">
                  {stepTypeIcon ? `نوع: ${stepTypeIcon}` : "ویرایش جزئیات این گام گردش کار"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormInput
                  control={form.control}
                  name="name"
                  label="نام گام"
                  placeholder="مثال: تأیید درخواست"
                  required
                  disabled={submitting}
                />
                <FormSelect
                  control={form.control}
                  name="stepType"
                  label="نوع گام"
                  placeholder="انتخاب…"
                  options={stepTypeOptions}
                  required
                  disabled={submitting}
                />
              </div>

              <FormInput
                control={form.control}
                name="description"
                label="توضیحات"
                placeholder="توضیحات گام…"
                disabled={submitting}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormSelect
                  control={form.control}
                  name="groupsOperator"
                  label="عملگر گروه‌ها"
                  placeholder="انتخاب…"
                  options={groupOperatorOptions}
                  disabled={submitting}
                />
                <FormCheckbox
                  control={form.control}
                  name="required"
                  label="اجباری"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-steel-border/15 bg-white/[0.02] p-4 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-electric-iris" />
                    <span className="text-sm font-medium text-moonlight">گروه‌های تخصیص</span>
                    <span className="rounded-full bg-electric-iris/8 px-1.5 py-0.5 text-[10px] text-electric-iris/70">
                      {groupFields.length}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    disabled={submitting}
                    onClick={() => appendGroup({ operator: "AND", unitId: "" })}
                  >
                    <Plus className="size-4" />
                    گروه جدید
                  </Button>
                </div>

                {groupFields.length === 0 && (
                  <p className="py-2 text-center text-xs text-fog/50">
                    هیچ گروه تخصیصی تعریف نشده است.
                  </p>
                )}

                {groupFields.map((groupField, groupIdx) => (
                  <div
                    key={groupField.id}
                    className="space-y-3 rounded-lg border border-steel-border/15 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-fog/70">
                        گروه تخصیص {groupIdx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={submitting || groupFields.length <= 1}
                        onClick={() => removeGroup(groupIdx)}
                        className="text-fog/50 hover:text-destructive"
                        title="حذف گروه"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormSelect
                        control={form.control}
                        name={`${groupsArrayName}.${groupIdx}.operator`}
                        label="عملگر واحدها"
                        placeholder="انتخاب…"
                        options={innerOperatorOptions}
                        disabled={submitting}
                      />
                      <FormSearchSelect
                        control={form.control}
                        name={`${groupsArrayName}.${groupIdx}.unitId`}
                        label="واحد"
                        placeholder="جستجوی واحد…"
                        disabled={submitting}
                        fetcher={async (search?: string) => {
                          const result = await getUnits(
                            {
                              activeRoleId: getActiveRoleIdFromStore(),
                              page: 1,
                              limit: 50,
                              search: search || undefined,
                            },
                            { _id: 1, name: 1, type: 1 }
                          )
                          if (!result.success || !result.body) return []
                          return result.body.map((u: { _id?: string; name?: string; type?: string }) => ({
                            _id: u._id || "",
                            name: u.name || "",
                            sublabel: u.type || undefined,
                          }))
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter className="gap-3">
                {step?._id && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDelete(true)}
                    disabled={submitting || deleting}
                    className="ms-auto gap-2 px-4 text-ember hover:bg-ember/5 hover:text-ember"
                  >
                    {deleting ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
                    حذف گام
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                    className="gap-2 px-4"
                  >
                    انصراف
                  </Button>
                  <Button type="submit" disabled={submitting} className="gap-2 px-5">
                    {submitting && <Loader2 className="size-5 animate-spin" />}
                    ذخیره گام
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف گام"
        description={`آیا از حذف «${step?.name || "این گام"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
