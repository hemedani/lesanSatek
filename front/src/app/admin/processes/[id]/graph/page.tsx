"use client";

import { useEffect, useState, use, useCallback } from "react";
import { toast } from "sonner";
import { ArrowRight, Printer, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProcessGraph } from "@/components/process/process-graph";
import { ProcessStepInspector } from "@/components/process/process-step-inspector";
import type { InspectorStep } from "@/components/process/process-step-inspector";
import { get } from "@/app/actions/process/get";
import { add as addStep } from "@/app/actions/processStep/add";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const statusLabels: Record<string, { label: string; variant: "active" | "inactive" | "pending" | "info" }> = {
  Draft: { label: "پیش‌نویس", variant: "inactive" },
  Active: { label: "فعال", variant: "active" },
  Archived: { label: "بایگانی", variant: "pending" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessData = any;

export default function ProcessGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [process, setProcess] = useState<ProcessData>(null);
  const [selectedStep, setSelectedStep] = useState<InspectorStep | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchProcess = useCallback(async () => {
    const result = await get(
      { activeRoleId: getActiveRoleIdFromStore(), _id: id },
      {
        _id: 1,
        name: 1,
        description: 1,
        status: 1,
        version: 1,
        isActive: 1,
        organization: { _id: 1, name: 1 },
        createdBy: { _id: 1, first_name: 1, last_name: 1 },
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
    );
    return result;
  }, [id]);

  const reload = useCallback(async () => {
    const result = await fetchProcess();
    if (result.success && result.body?.[0]) {
      setProcess(result.body[0]);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  }, [fetchProcess]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchProcess();
      if (cancelled) return;
      if (result.success && result.body?.[0]) {
        setProcess(result.body[0]);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchProcess]);

  const handleNodeSelect = useCallback((step: InspectorStep) => {
    setSelectedStep(step);
    setInspectorOpen(true);
  }, []);

  const handleAddStep = async () => {
    if (!process?._id) return;
    setAdding(true);
    const steps = process.steps || [];
    const order = steps.length > 0 ? Math.max(...steps.map((s: { order?: number }) => s.order || 0)) + 1 : 1;
    const result = await addStep(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        name: `گام ${order}`,
        description: undefined,
        stepType: "Approval",
        order,
        required: true,
        groupsOperator: "AND",
        assigneeGroups: [{ operator: "AND", unitIds: [] }],
        processId: process._id,
      },
      { _id: 1, name: 1 }
    );
    setAdding(false);
    if (result.success) {
      toast.success("گام جدید با موفقیت افزوده شد");
      await reload();
    } else {
      toast.error(result.body?.message || "خطا در افزودن گام");
    }
  };

  const handleSave = async () => {
    await reload();
    toast.success("نمودار با موفقیت ذخیره شد");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={1} />;
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
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={process.name || "نمودار فرآیند"}
        description={`نمایش گرافیکی گام‌های فرآیند · نسخه ${process.version || 1}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={statusLabels[process.status || ""]?.variant || "inactive"}
            label={statusLabels[process.status || ""]?.label || process.status || "—"}
          />
          <Link href={`/admin/processes/${id}`}>
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به فرآیند
            </Button>
          </Link>
          <Button variant="ghost" className="gap-2 px-4" onClick={handlePrint}>
            <Printer className="size-5" />
            چاپ
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 px-5"
            disabled={adding}
          >
            {adding ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            ذخیره نمودار
          </Button>
        </div>
      </PageHeader>

      <ProcessGraph
        process={process}
        onNodeSelect={handleNodeSelect}
        selectedStepId={selectedStep?._id || null}
        onAddStep={handleAddStep}
        adding={adding}
      />

      <ProcessStepInspector
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        step={selectedStep}
        onSaved={reload}
      />
    </div>
  );
}
