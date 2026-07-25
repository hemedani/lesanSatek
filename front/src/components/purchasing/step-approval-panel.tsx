"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { submitDecision } from "@/app/actions/stepApproval/submitDecision"
import { SearchSelect } from "@/components/form/form-search-select"
import { gets as getBudgetLines } from "@/app/actions/budgetLine/gets"
import { confirmDialog } from "@/components/ui/confirm-dialog"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface StepApprovalPanelProps {
  purchasingRequestId: string
  processStep?: {
    _id?: string
    name?: string
    description?: string
    assigneeGroups?: { operator?: string; unitIds?: string[] }[]
  }
  unitId: string
  unitType?: string
  existingApprovals?: { _id: string; status: string; comment?: string; unit?: { _id?: string } }[]
  onDecision?: () => void
}

function StepApprovalPanel({
  purchasingRequestId,
  processStep,
  unitId,
  unitType,
  existingApprovals = [],
  onDecision,
}: StepApprovalPanelProps) {
  const router = useRouter()
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [localDecision, setLocalDecision] = useState<{ status: string } | null>(null)
  const [budgetLineId, setBudgetLineId] = useState("")

  const isFinance = unitType === "Finance"
  const isAssignedToStep = !!(
    unitId &&
    processStep &&
    (processStep.assigneeGroups || []).some((g) => (g.unitIds || []).includes(unitId))
  )

  const myApproval = existingApprovals?.find((a) => a.unit?._id === unitId && (a.status === "approved" || a.status === "rejected"))
  const userDecision = myApproval || localDecision
  const hasDecided = !!userDecision

  const canApprove = !isFinance || !!budgetLineId

  const handleDecision = async (decision: "approved" | "rejected") => {
    const confirmed = await confirmDialog({
      title: decision === "approved" ? "تایید درخواست" : "رد درخواست",
      description:
        decision === "approved"
          ? "آیا از تایید این درخواست اطمینان دارید؟"
          : "آیا از رد این درخواست اطمینان دارید؟",
      confirmLabel: decision === "approved" ? "تایید" : "رد",
      variant: decision === "approved" ? "default" : "destructive",
    })
    if (!confirmed) return

    setSubmitting(decision)
    try {
      const result = await submitDecision(
        {
          purchasingRequestId: purchasingRequestId || "",
          processStepId: processStep?._id || "",
          unitId,
          status: decision,
          comment,
          ...(decision === "approved" && budgetLineId ? { budgetLineId } : {}),
        },
        { _id: 1, status: 1 },
      )
      if (result.success) {
        toast.success(decision === "approved" ? "درخواست با موفقیت تایید شد" : "درخواست رد شد")
        setLocalDecision({ status: decision })
        onDecision?.()
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در ثبت تصمیم")
      }
    } catch {
      toast.error("خطا در ثبت تصمیم")
    } finally {
      setSubmitting(null)
    }
  }

  if (!processStep) {
    return (
      <Card variant="glass">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-fog">هیچ مرحله فعالی برای تایید وجود ندارد</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-frost-link leading-6">
          {processStep.name || "مرحله جاری"}
        </CardTitle>
        {processStep.description && (
          <p className="text-sm text-fog mt-1">{processStep.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {existingApprovals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-fog">نظرات دیگر واحدها:</p>
            {existingApprovals.map((a) => (
              <div key={a._id} className="flex items-center gap-2 text-sm">
                {a.status === "approved" ? (
                  <CheckCircle className="size-4 text-emerald-400" />
                ) : a.status === "rejected" ? (
                  <XCircle className="size-4 text-ember" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-amber-400" />
                )}
                <span className="text-fog">{a.comment || "—"}</span>
              </div>
            ))}
          </div>
        )}

        {!isAssignedToStep && !hasDecided && (
          <div className="rounded-sm bg-zinc-400/5 border border-zinc-400/20 px-3 py-2 text-sm text-fog/60">
            <Loader2 className="size-4 inline ms-1.5 animate-spin" />
            در انتظار تایید واحد مربوطه
          </div>
        )}

        {isAssignedToStep && !hasDecided && (
          <>
            <div className="space-y-2">
              <label className="text-xs text-fog">توضیحات (اختیاری)</label>
              <Textarea
                placeholder="توضیحات خود را وارد کنید..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                dir="rtl"
              />
            </div>

            {isFinance && (
              <div className="space-y-2">
                <SearchSelect
                  value={budgetLineId}
                  onChange={setBudgetLineId}
                  label="ردیف بودجه"
                  placeholder="جستجوی ردیف بودجه..."
                  fetcher={async (search?: string) => {
                    const result = await getBudgetLines(
                      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, title: search || undefined } as any,
                      { _id: 1, code: 1, title: 1, remainingBudget: 1, totalAllocated: 1 }
                    )
                    if (!result.success || !result.body) return []
                    return result.body.map((b: { _id?: string; code?: string; title?: string; remainingBudget?: number; totalAllocated?: number }) => ({
                      _id: b._id || "",
                      name: `${b.code || ""} ${b.title || ""}`.trim(),
                      sublabel: b.remainingBudget != null ? `${b.remainingBudget.toLocaleString("fa-IR")} ریال` : undefined,
                    }))
                  }}
                  hasError={!budgetLineId && submitting === "approved"}
                />
                {!budgetLineId && submitting === "approved" && (
                  <p className="text-xs text-rose-400">انتخاب ردیف بودجه برای تایید الزامی است</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={() => handleDecision("approved")}
                disabled={submitting !== null || !canApprove}
                className="flex-1 gap-2"
              >
                {submitting === "approved" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4" />
                )}
                تایید
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDecision("rejected")}
                disabled={submitting !== null}
                className="flex-1 gap-2"
              >
                {submitting === "rejected" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4" />
                )}
                رد
              </Button>
            </div>
          </>
        )}

        {hasDecided && (
          <div className="rounded-sm bg-emerald-400/5 border border-emerald-400/20 px-3 py-2 text-sm text-emerald-400">
            <CheckCircle className="size-4 inline ms-1.5" />
            {userDecision.status === "approved"
              ? "این درخواست توسط شما تایید شده است"
              : "این درخواست توسط شما رد شده است"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { StepApprovalPanel }
