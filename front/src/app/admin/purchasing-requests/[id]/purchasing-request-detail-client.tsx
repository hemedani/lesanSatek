"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ShoppingCart, Building2, Package, Calendar, FileText, BarChart3, Store, Gavel, Send, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge";
import { WorkflowVisualizer } from "@/components/purchasing/workflow-visualizer";
import { HistoryTimeline } from "@/components/purchasing/history-timeline";
import { AddStuffDialog } from "@/components/purchasing/add-stuff-dialog";
import { TenderCreateDialog } from "@/components/purchasing/tender-create-dialog";
import { SubmitPRDialog } from "@/components/purchasing/submit-pr-dialog";
import { cn } from "@/lib/utils";

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

interface Unit {
  _id: string;
  name?: string;
}

interface WareModel {
  _id: string;
  name?: string;
  enName?: string;
}

interface Stuff {
  _id: string;
  quantity?: number;
  price?: number;
  hasAbsolutePrice?: boolean;
  pricePercentage?: number;
  ware?: { _id?: string; name?: string; brand?: string };
}

interface HistoryEntry {
  action?: string;
  performed?: {
    by?: string;
    name?: string;
    at?: string;
  };
}

interface BudgetLine {
  _id: string;
  code?: string;
  title?: string;
  remainingBudget?: number;
}

interface PurchasingRequest {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  currentStep?: number;
  quantity?: number;
  estimatedAmount?: number;
  selectionType?: string;
  stuffStatus?: string;
  createdAt?: string;
  process?: Process;
  budgetLine?: BudgetLine;
  requestingUnit?: Unit;
  wareModel?: WareModel;
  stuff?: Stuff;
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

  const [showAddStuff, setShowAddStuff] = useState(false);
  const [showCreateTender, setShowCreateTender] = useState(false);
  const [showSubmitPR, setShowSubmitPR] = useState(false);

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

  const isDraft = pr.status === "draft";
  const currentStep = pr.currentStep || 0;
  const totalSteps = pr.process?.steps?.length || 0;
  const isStuffAssigned = pr.stuffStatus === "assigned" || pr.stuffStatus === "received";

  const stuffStatusLabel: Record<string, string> = {
    none: "بدون کالا",
    assigned: "تخصیص داده شده",
    received: "دریافت شده",
    cancelled: "لغو شده",
  };

  const stuffStatusColor: Record<string, string> = {
    none: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    assigned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

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
                  <span className="text-[11px] px-2 py-0.5 rounded-sm bg-white/[0.03] text-fog/60 border border-steel-border/30">
                    {pr.process.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-[1]">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Visualizer — only if process is assigned */}
          {pr.process && pr.process.steps && pr.process.steps.length > 0 ? (
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
                  steps={pr.process.steps}
                  currentStep={currentStep}
                  status={pr.status}
                />
              </CardContent>
            </Card>
          ) : isDraft ? (
            <Card variant="glass">
              <CardContent className="py-8 text-center">
                <BarChart3 className="size-10 text-fog/20 mx-auto mb-3" />
                <p className="text-sm text-fog/50">پس از ارسال درخواست، فرآیند خرید به این درخواست متصل می‌شود.</p>
              </CardContent>
            </Card>
          ) : null}

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

          {/* Assigned Stuff */}
          {isStuffAssigned && pr.stuff && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BadgeCheck className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle>کالای تخصیص داده شده</CardTitle>
                    <CardDescription>اطلاعات محصول انتخاب شده</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-moonlight">
                      {pr.stuff.ware?.name || "—"}
                    </p>
                    {pr.stuff.ware?.brand && (
                      <p className="text-xs text-fog/50 mt-0.5">{pr.stuff.ware.brand}</p>
                    )}
                    {pr.stuff.quantity != null && (
                      <p className="text-xs text-fog/40 mt-0.5">تعداد: {pr.stuff.quantity.toLocaleString("fa-IR")}</p>
                    )}
                  </div>
                  <div className="text-end">
                    {pr.estimatedAmount != null && (
                      <p className="text-sm font-medium text-moonlight" dir="ltr">
                        {pr.estimatedAmount.toLocaleString("fa-IR")} ریال
                      </p>
                    )}
                    <Badge className={cn("text-[10px] mt-1", stuffStatusColor[pr.stuffStatus || "none"])}>
                      {stuffStatusLabel[pr.stuffStatus || "none"]}
                    </Badge>
                  </div>
                </div>
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
                  icon={Package}
                  label="تعداد"
                  value={pr.quantity != null ? pr.quantity.toLocaleString("fa-IR") : "—"}
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
                  icon={BadgeCheck}
                  label="وضعیت کالا"
                  value={
                    <Badge className={cn("text-[10px]", stuffStatusColor[pr.stuffStatus || "none"])}>
                      {stuffStatusLabel[pr.stuffStatus || "none"]}
                    </Badge>
                  }
                />
                {pr.estimatedAmount != null && (
                  <InfoRow
                    icon={Store}
                    label="مبلغ برآوردی"
                    value={`${pr.estimatedAmount.toLocaleString("fa-IR")} ریال`}
                  />
                )}
                {pr.selectionType && pr.selectionType !== "none" && (
                  <InfoRow
                    icon={ShoppingCart}
                    label="نحوه تأمین"
                    value={
                      <Badge className={cn(
                        "text-[10px]",
                        pr.selectionType === "stuff"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                      )}>
                        {pr.selectionType === "stuff" ? "تخصیص کالا" : "مناقصه"}
                      </Badge>
                    }
                  />
                )}
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
                  label="فرآیند"
                  value={pr.process?.name || "تعیین نشده"}
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

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isDraft ? (
              <Button className="w-full gap-2" size="sm" onClick={() => setShowSubmitPR(true)}>
                <Send className="size-4" />
                ارسال درخواست
              </Button>
            ) : (
              <>
                {!isStuffAssigned && (
                  <Button className="w-full gap-2" size="sm" onClick={() => setShowAddStuff(true)}>
                    <Package className="size-4" />
                    تخصیص کالا
                  </Button>
                )}
                <Button className="w-full gap-2" size="sm" variant="secondary" onClick={() => setShowCreateTender(true)}>
                  <Gavel className="size-4" />
                  ایجاد مناقصه
                </Button>
              </>
            )}
          </div>

          <SubmitPRDialog
            open={showSubmitPR}
            onOpenChange={setShowSubmitPR}
            purchasingRequestId={pr._id}
            title={pr.title}
            quantity={pr.quantity}
            wareModelName={pr.wareModel?.name}
          />
          <AddStuffDialog
            open={showAddStuff}
            onOpenChange={setShowAddStuff}
            purchasingRequestId={pr._id}
            wareModelId={pr.wareModel?._id}
            quantity={pr.quantity}
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
