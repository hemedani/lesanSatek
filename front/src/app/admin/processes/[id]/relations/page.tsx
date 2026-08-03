"use client"

import { useEffect, useState, use, useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Plus, Share2, Workflow } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RelationCard } from "@/components/process/relation-card"
import { RelationModal } from "@/components/process/relation-modal"
import type { ProcessScopeValues } from "@/components/process/process-scope-fields"
import { get } from "@/app/actions/process/get"
import { updateRelations } from "@/app/actions/process/updateRelations"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { Landmark, Building2, Tags, Layers, Package, Boxes, Box } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessData = any

type ScopeKey = "unit" | "wareType" | "wareClass" | "wareGroup" | "wareModel" | "ware"

const SCOPE_ID_KEY: Record<ScopeKey, keyof ProcessScopeValues> = {
  unit: "unitId",
  wareType: "wareTypeId",
  wareClass: "wareClassId",
  wareGroup: "wareGroupId",
  wareModel: "wareModelId",
  ware: "wareId",
}

const RELATION_LEVELS: {
  key: ScopeKey | "organization"
  label: string
  icon: React.ElementType
  tone: { icon: string; badge: string }
}[] = [
  {
    key: "organization",
    label: "سازمان",
    icon: Landmark,
    tone: {
      icon: "border-electric-iris/25 bg-electric-iris/10 text-electric-iris ring-electric-iris/15",
      badge: "border-electric-iris/25 bg-electric-iris/10 text-electric-iris",
    },
  },
  {
    key: "unit",
    label: "واحد",
    icon: Building2,
    tone: {
      icon: "border-frost-link/25 bg-frost-link/10 text-frost-link ring-frost-link/15",
      badge: "border-frost-link/25 bg-frost-link/10 text-frost-link",
    },
  },
  {
    key: "wareType",
    label: "نوع کالا",
    icon: Tags,
    tone: {
      icon: "border-azure/25 bg-azure/10 text-azure ring-azure/15",
      badge: "border-azure/25 bg-azure/10 text-azure",
    },
  },
  {
    key: "wareClass",
    label: "رده کالا",
    icon: Layers,
    tone: {
      icon: "border-amber-400/25 bg-amber-400/10 text-amber-400 ring-amber-400/15",
      badge: "border-amber-400/25 bg-amber-400/10 text-amber-400",
    },
  },
  {
    key: "wareGroup",
    label: "گروه کالا",
    icon: Package,
    tone: {
      icon: "border-emerald-400/25 bg-emerald-400/10 text-emerald-400 ring-emerald-400/15",
      badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-400",
    },
  },
  {
    key: "wareModel",
    label: "مدل کالا",
    icon: Boxes,
    tone: {
      icon: "border-white/15 bg-white/[0.04] text-fog ring-white/10",
      badge: "border-white/15 bg-white/[0.04] text-fog",
    },
  },
  {
    key: "ware",
    label: "کالا",
    icon: Box,
    tone: {
      icon: "border-white/15 bg-white/[0.04] text-fog ring-white/10",
      badge: "border-white/15 bg-white/[0.04] text-fog",
    },
  },
]

export default function ProcessRelationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [process, setProcess] = useState<ProcessData>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ScopeKey | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProcess = useCallback(async () => {
    const result = await get(
      { activeRoleId: getActiveRoleIdFromStore(), _id: id },
      {
        _id: 1,
        name: 1,
        organization: { _id: 1, name: 1 },
        unit: { _id: 1, name: 1 },
        wareType: { _id: 1, name: 1 },
        wareClass: { _id: 1, name: 1 },
        wareGroup: { _id: 1, name: 1 },
        wareModel: { _id: 1, name: 1 },
        ware: { _id: 1, name: 1 },
      }
    )
    return result
  }, [id])

  const reload = useCallback(async () => {
    const result = await fetchProcess()
    if (result.success && result.body?.[0]) {
      setProcess(result.body[0])
      setNotFound(false)
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
        setProcess(result.body[0])
        setNotFound(false)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchProcess])

  const orgId = process?.organization?._id || ""
  const scope: ProcessScopeValues = {
    unitId: process?.unit?._id || "",
    wareTypeId: process?.wareType?._id || "",
    wareClassId: process?.wareClass?._id || "",
    wareGroupId: process?.wareGroup?._id || "",
    wareModelId: process?.wareModel?._id || "",
    wareId: process?.ware?._id || "",
  }

  const activeRelations = RELATION_LEVELS.filter(({ key }) => {
    if (key === "organization") return !!orgId
    return !!scope[SCOPE_ID_KEY[key]]
  })

  const handleSave = async (newOrgId: string, newScope: ProcessScopeValues) => {
    const result = await updateRelations(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        ...(newOrgId ? { organizationId: newOrgId } : {}),
        ...(newScope.unitId ? { unitId: newScope.unitId } : {}),
        ...(newScope.wareTypeId ? { wareTypeId: newScope.wareTypeId } : {}),
        ...(newScope.wareClassId ? { wareClassId: newScope.wareClassId } : {}),
        ...(newScope.wareGroupId ? { wareGroupId: newScope.wareGroupId } : {}),
        ...(newScope.wareModelId ? { wareModelId: newScope.wareModelId } : {}),
        ...(newScope.wareId ? { wareId: newScope.wareId } : {}),
      },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("ارتباط‌ها با موفقیت به‌روزرسانی شدند")
      await reload()
      return true
    }
    toast.error(result.body?.message || "خطا در به‌روزرسانی ارتباط‌ها")
    return false
  }

  const clearFrom = (key: ScopeKey): ProcessScopeValues => {
    const order: ScopeKey[] = ["unit", "wareType", "wareClass", "wareGroup", "wareModel", "ware"]
    const fromIdx = order.indexOf(key)
    const next: ProcessScopeValues = { ...scope }
    for (let i = fromIdx; i < order.length; i++) {
      next[SCOPE_ID_KEY[order[i]]] = ""
    }
    return next
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const ok = await handleSave(orgId, clearFrom(deleteTarget))
    setDeleting(false)
    setDeleteTarget(null)
    if (ok) {
      toast.success("ارتباط با موفقیت حذف شد")
    }
  }

  if (loading) {
    return <LoadingSkeleton type="card-list" count={3} />
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

  const hasScopeRelations = activeRelations.some(({ key }) => key !== "organization")

  return (
    <div className="space-y-6">
      <PageHeader
        title={process.name || "ارتباط‌های فرآیند"}
        description="سازمان و حوزه کاربرد فرآیند را مشخص کنید"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <Share2 className="size-4 text-electric-iris" />
          {(activeRelations.length).toLocaleString("fa-IR")} ارتباط
        </span>
        <Link href={`/admin/processes/${id}`}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به فرآیند
          </Button>
        </Link>
        <Button onClick={() => setModalOpen(true)} className="gap-2 px-5">
          <Plus className="size-5" />
          افزودن ارتباط
        </Button>
      </PageHeader>

      <div className="mx-auto w-full max-w-3xl">
        <div className="space-y-4">
          {activeRelations.map(({ key, label, icon, tone }, index) => (
            <RelationCard
              key={key}
              label={label}
              name={key === "organization" ? process?.organization?.name || "—" : process?.[key]?.name || "—"}
              icon={icon}
              tone={tone}
              isLast={index === activeRelations.length - 1}
              deletable={key !== "organization"}
              busy={deleting && deleteTarget === key}
              onEdit={() => setModalOpen(true)}
              onDelete={key === "organization" ? undefined : () => setDeleteTarget(key as ScopeKey)}
            />
          ))}

          {!hasScopeRelations && (
            <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/10 bg-transparent px-6 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-electric-iris/15 bg-electric-iris/5 shadow-[0_0_30px_-8px_rgba(102,58,243,0.4)]">
                <Workflow className="size-8 text-electric-iris/80" />
              </div>
              <div>
                <p className="text-body font-medium text-moonlight">
                  هنوز ارتباطی بین مراحل تعریف نشده است
                </p>
                <p className="mt-1.5 text-body-sm text-fog/60">
                  حوزه کاربرد فرآیند را مشخص کنید تا در اینجا نمایش داده شود.
                </p>
              </div>
              <Button onClick={() => setModalOpen(true)} className="gap-2 px-5">
                <Plus className="size-5" />
                افزودن اولین ارتباط
              </Button>
            </div>
          )}
        </div>
      </div>

      <RelationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        orgId={orgId}
        scope={scope}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(val) => {
          if (!val) setDeleteTarget(null)
        }}
        title="حذف ارتباط"
        description="آیا از حذف این ارتباط اطمینان دارید؟ سطوح پایین‌تر حوزه کاربرد نیز حذف خواهند شد."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
