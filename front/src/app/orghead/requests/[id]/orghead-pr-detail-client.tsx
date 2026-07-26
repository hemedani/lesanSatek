"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ShoppingCart, Building2, Package, Calendar, FileText,
  BarChart3, Store, Gavel, BadgeCheck, User, Clock, DollarSign, Receipt,
  CreditCard, ShieldCheck, CheckCircle, Wallet, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge";
import { WorkflowVisualizer } from "@/components/purchasing/workflow-visualizer";
import { HistoryTimeline } from "@/components/purchasing/history-timeline";
import { SelectionInfo } from "@/components/orghead/selection-info";
import { PostCompletionSteps } from "@/components/orghead/post-completion-steps";
import { FinalizeModal } from "@/components/orghead/finalize-modal";
import { update as updatePaymentOrder } from "@/app/actions/paymentOrder/update";
import { toast } from "sonner";

interface StoreInfo { _id: string; name?: string; }
interface UnitInfo { _id: string; name?: string; head?: { _id: string; first_name?: string; last_name?: string }; }
interface WareModelInfo { _id: string; name?: string; }
interface RequesterInfo { _id: string; first_name?: string; last_name?: string; }
interface OrgInfo { _id: string; name?: string; enName?: string; }
interface BudgetLineInfo { _id: string; code?: string; title?: string; totalAllocated?: number; totalEncumbered?: number; }
interface StuffInfo { _id: string; quantity?: number; price?: number; store?: StoreInfo; }

interface StepApprovalItem {
  _id: string; status?: string; comment?: string; decidedAt?: string;
  processStep?: { _id?: string; name?: string };
  unit?: { _id?: string; name?: string };
  decidedBy?: { _id?: string; first_name?: string; last_name?: string; position?: string };
}

interface TenderOffer {
  _id: string; price?: number; deliveryTime?: string; status?: string; store?: StoreInfo;
}

interface TenderItem {
  _id: string; title?: string; status?: string; deadline?: string; offers?: TenderOffer[];
}

interface GoodsReceiptItem {
  _id: string; receiptNumber?: string; items?: unknown[]; status?: string;
}

interface PaymentOrderItem {
  _id: string; title?: string; amount?: number; status?: string; paidAt?: string;
}

interface PostCompletionStep {
  _id?: string; name: string; description?: string; unitId: string; comment?: string; status?: string;
}

interface PurchasingRequest {
  _id: string; title?: string; description?: string; status?: string;
  currentStep?: number; quantity?: number; estimatedAmount?: number;
  selectionType?: string; stuffStatus?: string; selectedTenderOfferId?: string;
  finalizedAt?: string; completedAt?: string; createdAt?: string;
  organization?: OrgInfo; requester?: RequesterInfo; requestingUnit?: UnitInfo;
  wareModel?: WareModelInfo; budgetLine?: BudgetLineInfo; store?: StoreInfo;
  stuff?: StuffInfo; process?: { _id: string; name?: string; steps?: unknown[] };
  stepApprovals?: StepApprovalItem[];
  tenders?: TenderItem[];
  goodsReceipts?: GoodsReceiptItem[];
  paymentOrders?: PaymentOrderItem[];
  history?: unknown[];
  postCompletionSteps?: PostCompletionStep[];
}

interface OrgHeadPRDetailClientProps {
  pr: PurchasingRequest | null;
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

export function OrgHeadPRDetailClient({ pr }: OrgHeadPRDetailClientProps) {
  const router = useRouter();
  const [showFinalize, setShowFinalize] = useState(false);

  if (!pr) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShoppingCart className="size-12 text-fog/20" />
        <p className="text-fog/50">درخواست خرید یافت نشد.</p>
        <Button variant="ghost" onClick={() => router.push("/orghead/requests")}>
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  const currentStep = pr.currentStep || 0;
  const totalSteps = (pr.process?.steps?.length as number) || 0;
  const isPendingFinalization = pr.status === "PendingFinalization";

  const stuffStatusLabel: Record<string, string> = {
    none: "بدون کالا",
    assigned: "تخصیص داده شده",
    ready_to_ship: "آماده ارسال",
    shipped: "ارسال شده",
    delivered: "تحویل داده شده",
    received: "دریافت شده",
    cancelled: "لغو شده",
  };
  const stuffStatusColor: Record<string, string> = {
    none: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    assigned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ready_to_ship: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    shipped: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    delivered: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  const handleFinalizeSuccess = () => {
    setShowFinalize(false);
    router.refresh();
  };

  const draftPaymentOrder = pr.paymentOrders?.find((po) => po.status === "draft");
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [paying, setPaying] = useState(false);

  const handleSendToFinance = async () => {
    if (!draftPaymentOrder) return;
    setPaying(true);
    setShowPayConfirm(false);
    try {
      const result = await updatePaymentOrder({ _id: draftPaymentOrder._id, status: "sent_to_finance" });
      if (result.success) {
        toast.success("دستور پرداخت به واحد مالی ارسال شد");
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در ارسال به واحد مالی");
      }
    } catch {
      toast.error("خطا در ارسال به واحد مالی");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="relative z-[1]">
        <div className="flex items-center justify-between pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/orghead/requests")} className="shrink-0 rounded-lg">
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
                {pr.organization?.name && (
                  <span className="text-[11px] px-2 py-0.5 rounded-sm bg-white/[0.03] text-fog/60 border border-steel-border/30">
                    <Building2 className="size-3 inline me-1" />
                    {pr.organization.name}
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
          {/* Workflow Visualizer */}
          {pr.process && pr.process.steps && pr.process.steps.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                    <BarChart3 className="size-4 text-electric-iris" />
                  </div>
                  <div>
                    <CardTitle>پیشرفت فرآیند</CardTitle>
                    <CardDescription>مرحله {currentStep} از {totalSteps}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <WorkflowVisualizer
                  steps={pr.process.steps as any}
                  currentStepIndex={currentStep}
                  status={pr.status}
                  approvals={pr.stepApprovals as any}
                />
              </CardContent>
            </Card>
          )}

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

          {/* Selection Info */}
          {(pr.stuffStatus === "assigned" || pr.selectedTenderOfferId) && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BadgeCheck className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle>وضعیت انتخاب</CardTitle>
                    <CardDescription>کالا و مناقصه‌های انتخاب شده</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SelectionInfo
                  stuffStatus={pr.stuffStatus}
                  stuff={pr.stuff}
                  selectedTenderOfferId={pr.selectedTenderOfferId}
                  tenders={pr.tenders as any}
                />
              </CardContent>
            </Card>
          )}

          {/* Tenders Section */}
          {pr.tenders && pr.tenders.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Gavel className="size-4 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle>مناقصات</CardTitle>
                    <CardDescription>{pr.tenders.length} مناقصه</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pr.tenders.map((tender) => {
                    const isWinning = tender.offers?.some((o) => o._id === pr.selectedTenderOfferId && o.status === "awarded");
                    return (
                      <div
                        key={tender._id}
                        className={`rounded-lg border p-4 ${
                          isWinning
                            ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                            : "border-steel-border/15 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Gavel className="size-4 text-fog/50" />
                            <span className="text-sm font-medium text-moonlight">{tender.title || "بدون عنوان"}</span>
                          </div>
                          <Badge className="text-[10px]">{tender.status || "—"}</Badge>
                        </div>
                        {tender.deadline && (
                          <p className="text-xs text-fog/50 mb-2">
                            مهلت: {new Date(tender.deadline).toLocaleDateString("fa-IR")}
                          </p>
                        )}
                        {tender.offers && tender.offers.length > 0 && (
                          <div className="space-y-1.5 mt-2">
                            <p className="text-[11px] text-fog/50 font-medium">پیشنهادها:</p>
                            {tender.offers.map((offer) => {
                              const isSelectedOffer = offer._id === pr.selectedTenderOfferId;
                              return (
                                <div
                                  key={offer._id}
                                  className={`flex items-center justify-between p-2 rounded-md text-xs ${
                                    isSelectedOffer
                                      ? "bg-emerald-500/10 border border-emerald-500/20"
                                      : "bg-white/[0.02]"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Store className="size-3 text-fog/40" />
                                    <span className="text-fog/70">{offer.store?.name || "—"}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {offer.price != null && (
                                      <span className="text-fog font-mono">{offer.price.toLocaleString("fa-IR")} ریال</span>
                                    )}
                                    {isSelectedOffer && (
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                        انتخاب شده
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goods Receipts */}
          {pr.goodsReceipts && pr.goodsReceipts.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Receipt className="size-4 text-teal-400" />
                  </div>
                  <div>
                    <CardTitle>رسیدهای دریافت</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pr.goodsReceipts.map((gr) => (
                    <div key={gr._id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-steel-border/10">
                      <div className="flex items-center gap-2">
                        <Receipt className="size-4 text-fog/40" />
                        <span className="text-sm text-fog">{gr.receiptNumber || "—"}</span>
                      </div>
                      <Badge className="text-[10px]">{gr.status || "—"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Orders */}
          {pr.paymentOrders && pr.paymentOrders.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <CreditCard className="size-4 text-rose-400" />
                  </div>
                  <div>
                    <CardTitle>دستورات پرداخت</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pr.paymentOrders.map((po) => (
                    <div key={po._id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-steel-border/10">
                      <div>
                        <p className="text-sm text-fog">{po.title || "—"}</p>
                        {po.amount != null && (
                          <p className="text-xs text-fog/50 mt-0.5">{po.amount.toLocaleString("fa-IR")} ریال</p>
                        )}
                      </div>
                      <div className="text-end">
                        <Badge className="text-[10px]">{po.status || "—"}</Badge>
                        {po.paidAt && (
                          <p className="text-[10px] text-fog/40 mt-0.5">
                            {new Date(po.paidAt).toLocaleDateString("fa-IR")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post-completion Steps */}
          {pr.postCompletionSteps && pr.postCompletionSteps.length > 0 && (
            <PostCompletionSteps steps={pr.postCompletionSteps} />
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
              <HistoryTimeline history={pr.history as any || []} />
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
                <InfoRow icon={Package} label="تعداد" value={pr.quantity != null ? pr.quantity.toLocaleString("fa-IR") : "—"} />
                <InfoRow icon={BarChart3} label="بودجه" value={pr.budgetLine ? `${pr.budgetLine.code || ""} - ${pr.budgetLine.title || ""}` : "—"} />
                {pr.budgetLine?.totalAllocated != null && (
                  <InfoRow icon={DollarSign} label="تخصیص یافته" value={`${pr.budgetLine.totalAllocated.toLocaleString("fa-IR")} ریال`} />
                )}
                {pr.budgetLine?.totalEncumbered != null && (
                  <InfoRow icon={DollarSign} label="تعهد شده" value={`${pr.budgetLine.totalEncumbered.toLocaleString("fa-IR")} ریال`} />
                )}
                <InfoRow icon={BadgeCheck} label="وضعیت کالا" value={
                  <Badge className={`text-[10px] ${stuffStatusColor[pr.stuffStatus || "none"]}`}>
                    {stuffStatusLabel[pr.stuffStatus || "none"]}
                  </Badge>
                } />
                {pr.estimatedAmount != null && (
                  <InfoRow icon={Store} label="مبلغ برآوردی" value={`${pr.estimatedAmount.toLocaleString("fa-IR")} ریال`} />
                )}
                {pr.selectionType && pr.selectionType !== "none" && (
                  <InfoRow icon={ShoppingCart} label="نحوه تأمین" value={
                    <Badge className={`text-[10px] ${
                      pr.selectionType === "stuff" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                    }`}>
                      {pr.selectionType === "stuff" ? "تخصیص کالا" : "مناقصه"}
                    </Badge>
                  } />
                )}
                <InfoRow icon={User} label="درخواست‌کننده" value={
                  pr.requester ? `${pr.requester.first_name || ""} ${pr.requester.last_name || ""}` : "—"
                } />
                <InfoRow icon={Building2} label="واحد درخواست‌کننده" value={pr.requestingUnit?.name || "—"} />
                <InfoRow icon={ShoppingCart} label="مدل کالا" value={pr.wareModel?.name || "—"} />
                <InfoRow icon={Building2} label="سازمان" value={pr.organization?.name || "—"} />
                <InfoRow icon={BarChart3} label="فرآیند" value={pr.process?.name || "تعیین نشده"} />
                <InfoRow icon={Calendar} label="تاریخ ایجاد" value={pr.createdAt ? new Date(pr.createdAt).toLocaleDateString("fa-IR") : "—"} />
                {pr.finalizedAt && (
                  <InfoRow icon={Clock} label="تاریخ نهایی‌سازی" value={new Date(pr.finalizedAt).toLocaleDateString("fa-IR")} />
                )}
                {pr.completedAt && (
                  <InfoRow icon={CheckCircle} label="تاریخ تکمیل" value={new Date(pr.completedAt).toLocaleDateString("fa-IR")} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          {pr.stuffStatus === "received" && draftPaymentOrder && (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <Wallet className="size-4 text-rose-400" />
                  </div>
                  <div>
                    <CardTitle>ارسال به مالی</CardTitle>
                    <CardDescription>
                      {draftPaymentOrder.title || "دستور پرداخت"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {draftPaymentOrder.amount != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-fog">مبلغ</span>
                    <span className="text-sm font-semibold text-moonlight">
                      {draftPaymentOrder.amount.toLocaleString("fa-IR")} ریال
                    </span>
                  </div>
                )}
                <Button
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => setShowPayConfirm(true)}
                  disabled={paying}
                >
                  {paying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  {paying ? "در حال ارسال..." : "ارسال به مالی"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isPendingFinalization && (
              <Button className="w-full gap-2" size="sm" onClick={() => setShowFinalize(true)}>
                <ShieldCheck className="size-4" />
                تأیید نهایی
              </Button>
            )}
            <Button variant="ghost" className="w-full gap-2" size="sm" onClick={() => router.push("/orghead/requests")}>
              <ArrowRight className="size-4" />
              بازگشت به لیست
            </Button>
          </div>
        </div>
      </div>

      <FinalizeModal
        open={showFinalize}
        onOpenChange={setShowFinalize}
        pr={pr}
        onSuccess={handleFinalizeSuccess}
      />

      <ConfirmDialog
        open={showPayConfirm}
        onOpenChange={(open) => { if (!open) setShowPayConfirm(false) }}
        title="ارسال به واحد مالی"
        description={`آیا از ارسال دستور پرداخت به مبلغ ${draftPaymentOrder?.amount?.toLocaleString("fa-IR") || "—"} ریال به واحد مالی اطمینان دارید؟`}
        confirmLabel="ارسال به مالی"
        onConfirm={handleSendToFinance}
        loading={paying}
      />
    </div>
  );
}
