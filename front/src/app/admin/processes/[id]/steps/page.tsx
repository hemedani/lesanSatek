"use client"

import { useEffect, useState, use, useCallback, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Plus, Workflow } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StepCard, type StepCardStep } from "@/components/process/step-card"
import { ProcessStepModal } from "@/components/process/process-step-modal"
import { get } from "@/app/actions/process/get"
import { get as getUnit } from "@/app/actions/unit/get"
import { update as updateStep } from "@/app/actions/processStep/update"
import { remove as removeStep } from "@/app/actions/processStep/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessData = any

interface StepUnitData {
  _id: string
  name?: string
  type?: string
}

export default function EditProcessStepsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [process, setProcess] = useState<ProcessData>(null)
  const [steps, setSteps] = useState<StepCardStep[]>([])
  const [unitsMap, setUnitsMap] = useState<Record<string, StepUnitData>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<StepCardStep | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StepCardStep | null>(null)
  const [moving, setMoving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProcess = useCallback(async () => {
    const result = await get(
      { activeRoleId: getActiveRoleIdFromStore(), _id: id },
      {
        _id: 1,
        name: 1,
        status: 1,
        version: 1,
        steps: {
          _id: 1,
          name: 1,
          description: 1,
          stepType: 1,
          order: 1,
          required: 1,
          groupsOperator: 1,
          assigneeGroups: 1,
        },
      }
    )
    return result
  }, [id])

  const reload = useCallback(async () => {
    const result = await fetchProcess()
    if (result.success && result.body?.[0]) {
      const p = result.body[0]
      setProcess(p)
      setNotFound(false)
      setSteps(
        (p.steps || []).slice().sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0))
      )
    } else {
      setNotFound(true)
    }
  }, [fetchProcess])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await fetchProcess()
      if (cancelled) return
      if (result.success && result.body?.[0]) {
        const p = result.body[0]
        setProcess(p)
        setNotFound(false)
        setSteps(
          (p.steps || []).slice().sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0))
        )
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchProcess])

  const unitIds = useMemo(
    () =>
      Array.from(
        new Set(
          steps.flatMap((s) => (s.assigneeGroups || []).flatMap((g) => g.unitIds || []).filter(Boolean))
        )
      ),
    [steps]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (unitIds.length === 0) {
        setUnitsMap({})
        return
      }
      const results = await Promise.allSettled(
        unitIds.map((uid) =>
          getUnit({ activeRoleId: getActiveRoleIdFromStore(), _id: uid }, { _id: 1, name: 1, type: 1 })
        )
      )
      if (cancelled) return
      const map: Record<string, StepUnitData> = {}
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.success && result.value.body?.[0]) {
          const unit = result.value.body[0]
          map[unit._id] = unit
        }
      }
      setUnitsMap(map)
    })()
    return () => {
      cancelled = true
    }
  }, [unitIds])

  const moveStep = useCallback(
    async (index: number, dir: -1 | 1) => {
      const target = index + dir
      if (target < 0 || target >= steps.length) return
      const a = steps[index]
      const b = steps[target]
      if (!a._id || !b._id) return
      setMoving(a._id)
      const orderA = a.order ?? index + 1
      const orderB = b.order ?? target + 1
      setSteps((prev) => {
        const next = [...prev]
        next[index] = { ...b, order: orderA }
        next[target] = { ...a, order: orderB }
        return next
      })
      const results = await Promise.all([
        updateStep({ activeRoleId: getActiveRoleIdFromStore(), _id: a._id, order: orderB }, { _id: 1 }),
        updateStep({ activeRoleId: getActiveRoleIdFromStore(), _id: b._id, order: orderA }, { _id: 1 }),
      ])
      setMoving(null)
      if (results.every((r) => r.success)) {
        toast.success("ترتیب گام‌ها با موفقیت به‌روزرسانی شد")
        await reload()
      } else {
        toast.error("خطا در تغییر ترتیب گام‌ها")
        await reload()
      }
    },
    [steps, reload]
  )

  const openAdd = () => {
    setEditingStep(null)
    setModalOpen(true)
  }

  const openEdit = (step: StepCardStep) => {
    setEditingStep(step)
    setModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget?._id) return
    setDeleting(true)
    const result = await removeStep({
      activeRoleId: getActiveRoleIdFromStore(),
      _id: deleteTarget._id,
    })
    setDeleting(false)
    setDeleteTarget(null)
    if (result.success) {
      toast.success("گام با موفقیت حذف شد")
      await reload()
    } else {
      toast.error(result.body?.message || "خطا در حذف گام")
    }
  }

  if (loading) {
    return <LoadingSkeleton type="card-list" count={4} />
  }

  if (notFound || !process) {
    return (
      <div>
        <ErrorState
          title="فرآیند مورد نظر یافت نشد"
          message="فرآیندی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/processes">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={process.name || "گام‌های فرآیند"}
        description={`مدیریت گام‌های گردش کار · نسخه ${process.version || 1}`}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <Workflow className="size-4 text-electric-iris" />
          {(steps.length).toLocaleString("fa-IR")} مرحله
        </span>
        <HelpLauncher topicId="admin-process-steps" tooltip="راهنمای گام‌های فرآیند" />
        <Link href={`/admin/processes/${id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به فرآیند
          </Button>
        </Link>
        <Button onClick={openAdd} className="gap-2 px-5">
          <Plus className="size-5" />
          افزودن مرحله
        </Button>
      </PageHeader>

      {steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-white/8 bg-transparent px-6 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-electric-iris/15 bg-electric-iris/5 shadow-[0_0_30px_-8px_rgba(102,58,243,0.4)]">
            <Workflow className="size-8 text-electric-iris/80" />
          </div>
          <div>
            <p className="text-body font-medium text-moonlight">هنوز مرحله‌ای تعریف نشده است</p>
            <p className="mt-1.5 text-body-sm text-fog/60">
              برای شروع، اولین گام گردش کار این فرآیند را اضافه کنید.
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2 px-5">
            <Plus className="size-5" />
            افزودن اولین مرحله
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <StepCard
              key={step._id || index}
              step={step}
              index={index}
              unitsMap={unitsMap}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
              moving={moving === step._id}
              onMoveUp={() => moveStep(index, -1)}
              onMoveDown={() => moveStep(index, 1)}
              onEdit={() => openEdit(step)}
              onDelete={() => setDeleteTarget(step)}
            />
          ))}
        </div>
      )}

      <ProcessStepModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        processId={id}
        step={editingStep}
        nextOrder={steps.length > 0 ? Math.max(...steps.map((s) => s.order || 0)) + 1 : 1}
        onSaved={reload}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(val) => {
          if (!val) setDeleteTarget(null)
        }}
        title="حذف گام"
        description={`آیا از حذف «${deleteTarget?.name || "این گام"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
