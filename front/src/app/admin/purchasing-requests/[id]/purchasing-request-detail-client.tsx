"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ShoppingCart, Building2, DollarSign, Package, Calendar, FileText, BarChart3, Store, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge";
import { WorkflowVisualizer } from "@/components/purchasing/workflow-visualizer";
import { HistoryTimeline } from "@/components/purchasing/history-timeline";
import { AssignStoreDialog } from "@/components/purchasing/assign-store-dialog";
import { TenderCreateDialog } from "@/components/purchasing/tender-create-dialog";

interface ProcessStep {
  _id: string;
  name?: string;
  order?: number;
}

interface Process {
  _id: string;
  name?: string;
  description?: string;
  steps?: ProcessStep[];
}

interface BudgetLine {
  _id: string;
  code?: string;
  title?: string;
  remainingBudget?: number;
}

interface Unit {
  _id: string;
  name?: string;
}

interface WareModel {
  _id: string;
  name?: string;
  enName?: string;
}

interface HistoryEntry {
  action?: string;
  performed?: {
    by?: string;
    name?: string;
    at?: string;
  };
}

interface PurchasingRequest {
  _id: string;
  title?: string;
  description?: string;
  estimatedAmount?: number;
  status?: string;
  currentStep?: number;
  quantity?: number;
  createdAt?: string;
  process?: Process;
  budgetLine?: BudgetLine;
  requestingUnit?: Unit;
  wareModel?: WareModel;
  history?: HistoryEntry[];
}

interface PurchasingRequestDetailClientProps {
  pr: PurchasingRequest | null;
  history: HistoryEntry[];
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-steel-border/20 last:border-b-0">
      <div className="size-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
        <Icon className="size-4 text-fog/50" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fog/50">{label}</p>
        <div className="text-sm text-moonlight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function PurchasingRequestDetailClient({ pr, history }: PurchasingRequestDetailClientProps) {
  const router = useRouter();

  const [showAssignStore, setShowAssignStore] = useState(false);
  const [showCreateTender, setShowCreateTender] = useState(false);

  if (!pr) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShoppingCart className="size-12 text-fog/20" />
        <p className="text-fog/50">درخواست خرید یافت نشد.</p>
        <Button variant="ghost" onClick={() => router.push("/admin/purchasing-requests")}>
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  const currentStep = pr.currentStep || 0;
  const totalSteps = pr.process?.steps?.length || 0;

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="relative z-[1]">
        <div className="flex items-center justify-between pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/admin/purchasing-requests")}
              className="shrink-0 rounded-lg"
            >
              <ArrowRight className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
                {pr.title || "بدون عنوان"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <RequestStatusBadge status={pr.status} />
                {pr.process?.name && (
                  <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-white/[0.03] text-fog/60 border-steel-border/30">
                    {pr.process.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-[1]">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Visualizer */}
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <BarChart3 className="size-4 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>پیشرفت فرآیند</CardTitle>
                  <CardDescription>
                    مرحله {currentStep} از {totalSteps}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WorkflowVisualizer
                steps={pr.process?.steps || []}
                currentStep={currentStep}
                status={pr.status}
              />
            </CardContent>
          </Card>

          {/* Description */}
          {pr.description && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                    <FileText className="size-4 text-electric-iris" />
                  </div>
                  <div>
                    <CardTitle>توضیحات</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-moonlight/80 leading-relaxed">{pr.description}</p>
              </CardContent>
            </Card>
          )}

          {/* History Timeline */}
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Calendar className="size-4 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>تاریخچه اقدامات</CardTitle>
                  <CardDescription>سوابق و تغییرات وضعیت</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <HistoryTimeline history={history || pr.history || []} />
            </CardContent>
          </Card>
        </div>

          {/* Sidebar (1/3) */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <ShoppingCart className="size-4 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>اطلاعات درخواست</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow
                  icon={DollarSign}
                  label="مبلغ تخمینی"
                  value={
                    pr.estimatedAmount != null
                      ? `${pr.estimatedAmount.toLocaleString("fa-IR")} ریال`
                      : "—"
                  }
                />
                <InfoRow
                  icon={Package}
                  label="تعداد"
                  value={pr.quantity != null ? pr.quantity.toLocaleString("fa-IR") : "—"}
                />
                <InfoRow
                  icon={Building2}
                  label="واحد درخواست‌کننده"
                  value={pr.requestingUnit?.name || "—"}
                />
                <InfoRow
                  icon={ShoppingCart}
                  label="مدل کالا"
                  value={
                    <div>
                      <span>{pr.wareModel?.name || "—"}</span>
                      {pr.wareModel?.enName && (
                        <span className="text-fog/50 text-xs me-2">({pr.wareModel.enName})</span>
                      )}
                    </div>
                  }
                />
                <InfoRow
                  icon={BarChart3}
                  label="بودجه"
                  value={
                    pr.budgetLine
                      ? `${pr.budgetLine.code || ""} - ${pr.budgetLine.title || ""}`
                      : "—"
                  }
                />
                <InfoRow
                  icon={Calendar}
                  label="تاریخ ایجاد"
                  value={
                    pr.createdAt
                      ? new Date(pr.createdAt).toLocaleDateString("fa-IR")
                      : "—"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card variant="glass">
            <CardContent className="p-4">
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => setShowAssignStore(true)}
              >
                <Store className="size-4" />
                تخصیص فروشگاه
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full gap-2" size="sm" onClick={() => setShowAssignStore(true)}>
              <Store className="size-4" />
              تخصیص فروشگاه
            </Button>
            <Button className="w-full gap-2" size="sm" variant="secondary" onClick={() => setShowCreateTender(true)}>
              <Gavel className="size-4" />
              ایجاد مناقصه
            </Button>
          </div>

          <AssignStoreDialog
            open={showAssignStore}
            onOpenChange={setShowAssignStore}
            purchasingRequestId={pr._id}
            wareModelId={pr.wareModel?._id}
          />
          <TenderCreateDialog
            open={showCreateTender}
            onOpenChange={setShowCreateTender}
            purchasingRequestId={pr._id}
          />
        </div>
      </div>
    </div>
  );
}
