"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, ShoppingCart, Building2, Package, DollarSign, Calendar, CheckCircle, ShieldCheck, Store } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FinalizeModal } from "@/components/orghead/finalize-modal";
import { update as updatePaymentOrder } from "@/app/actions/paymentOrder/update";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Unit {
  _id: string;
  name?: string;
}

interface WareModel {
  _id: string;
  name?: string;
}

interface Organization {
  _id: string;
  name?: string;
}

interface PaymentOrder {
  _id: string;
  title?: string;
  amount?: number;
  status?: string;
}

interface PurchasingRequest {
  _id: string;
  title?: string;
  status?: string;
  quantity?: number;
  estimatedAmount?: number;
  selectionType?: string;
  stuffStatus?: string;
  selectedTenderOfferId?: string;
  finalizedAt?: string;
  completedAt?: string;
  createdAt?: string;
  requestingUnit?: Unit;
  wareModel?: WareModel;
  organization?: Organization;
}

interface RequestsClientProps {
  items: PurchasingRequest[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  activeTab: string;
  paymentOrdersByPRId?: Record<string, PaymentOrder>;
}

const TAB_KEYS = ["pending", "payment", "completed", "all"] as const;

const TAB_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
  payment: "نیازمند پرداخت",
  completed: "تکمیل شده",
  all: "همه درخواست‌ها",
};

function getSelectionLabel(item: PurchasingRequest): string {
  const hasStuff = item.stuffStatus === "assigned";
  const hasTender = !!item.selectedTenderOfferId;
  if (hasStuff && hasTender) return "کالا + مناقصه";
  if (hasStuff) return "کالا";
  if (hasTender) return "مناقصه";
  return "—";
}

function getSelectionColor(item: PurchasingRequest): string {
  const hasStuff = item.stuffStatus === "assigned";
  const hasTender = !!item.selectedTenderOfferId;
  if (hasStuff && hasTender) return "text-amber-400";
  if (hasStuff) return "text-blue-400";
  if (hasTender) return "text-violet-400";
  return "text-fog/40";
}

export function RequestsClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  activeTab,
  paymentOrdersByPRId = {},
}: RequestsClientProps) {
  const router = useRouter();
  const [finalizePR, setFinalizePR] = useState<PurchasingRequest | null>(null);
  const [payPR, setPayPR] = useState<PurchasingRequest | null>(null);
  const [paying, setPaying] = useState(false);

  const handleTabChange = useCallback(
    (value: string) => {
      router.push(`/orghead/requests?tab=${value}`);
    },
    [router]
  );

  const handleFinalizeSuccess = useCallback(() => {
    setFinalizePR(null);
    router.refresh();
  }, [router]);

  const handleSendToFinance = useCallback(async () => {
    if (!payPR) return;
    const po = paymentOrdersByPRId[payPR._id];
    if (!po) {
      toast.error("دستور پرداختی برای این درخواست یافت نشد");
      return;
    }
    setPaying(true);
    try {
      const result = await updatePaymentOrder({ _id: po._id, status: "sent_to_finance" });
      if (result.success) {
        toast.success("دستور پرداخت به واحد مالی ارسال شد");
        setPayPR(null);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در ارسال به واحد مالی");
      }
    } catch {
      toast.error("خطا در ارسال به واحد مالی");
    } finally {
      setPaying(false);
    }
  }, [payPR, paymentOrdersByPRId, router]);

  const activeTabIndex = TAB_KEYS.indexOf(activeTab as typeof TAB_KEYS[number]) !== -1
    ? activeTab
    : "pending";

  const getEmptyMessage = (key: string) => {
    switch (key) {
      case "pending": return "هیچ درخواستی در انتظار تأیید نهایی نیست.";
      case "payment": return "هیچ درخواستی نیازمند پرداخت نیست.";
      case "completed": return "هیچ درخواست تکمیل شده‌ای یافت نشد.";
      default: return "هیچ درخواست خریدی برای سازمان شما یافت نشد.";
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="درخواست‌های خرید"
          description="مدیریت و نهایی‌سازی درخواست‌های خرید سازمان"
        />
      </div>

      <Tabs value={activeTabIndex} onValueChange={handleTabChange} className="w-full" dir="rtl">
        <TabsList>
          {TAB_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {TAB_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_KEYS.map((key) => (
          <TabsContent key={key} value={key} className="pt-4">
            <div className="grid gap-3">
              {items.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
                    <ShoppingCart className="size-6 text-fog/30" />
                  </div>
                  <p className="text-sm font-medium text-fog/50 mb-1">درخواستی یافت نشد</p>
                  <p className="text-xs text-fog/30">{getEmptyMessage(key)}</p>
                </div>
              ) : (
                items.map((item) => {
                  const po = paymentOrdersByPRId[item._id];
                  const isPayTab = key === "payment";

                  return (
                    <div
                      key={item._id}
                      className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        if (item.status === "PendingFinalization") {
                          setFinalizePR(item);
                        } else {
                          router.push(`/orghead/requests/${item._id}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldCheck className="size-5 text-electric-iris" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-moonlight leading-6 truncate">
                              {item.title || "—"}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <RequestStatusBadge status={item.status} />
                              {item.organization?.name && (
                                <span className="text-xs text-fog/50 truncate flex items-center gap-1">
                                  <Building2 className="size-3 shrink-0" />
                                  {item.organization.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {item.status === "PendingFinalization" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFinalizePR(item);
                            }}
                          >
                            <Clock className="size-4" />
                            تأیید نهایی
                          </Button>
                        )}
                        {isPayTab && po && (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPayPR(item);
                            }}
                          >
                            <DollarSign className="size-4" />
                            ارسال به مالی
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-x-5 gap-y-2 mt-3 text-xs text-fog/60 flex-wrap">
                        {item.requestingUnit?.name && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-fog/40" />
                            {item.requestingUnit.name}
                          </span>
                        )}
                        {item.wareModel?.name && (
                          <span className="flex items-center gap-1.5">
                            <Package className="size-3.5 text-fog/40" />
                            {item.wareModel.name}
                          </span>
                        )}
                        {item.quantity != null && (
                          <span className="flex items-center gap-1.5" dir="ltr">
                            <ShoppingCart className="size-3.5 text-fog/40" />
                            {item.quantity.toLocaleString("fa-IR")} عدد
                          </span>
                        )}
                        {item.estimatedAmount != null && (
                          <span className="flex items-center gap-1.5" dir="ltr">
                            <DollarSign className="size-3.5 text-fog/40" />
                            {item.estimatedAmount.toLocaleString("fa-IR")} ریال
                          </span>
                        )}
                        {isPayTab && po && po.amount != null && (
                          <span className="flex items-center gap-1.5 text-amber-400" dir="ltr">
                            <DollarSign className="size-3.5" />
                            مبلغ پرداخت: {po.amount.toLocaleString("fa-IR")} ریال
                          </span>
                        )}
                        <span className={cn("flex items-center gap-1.5", getSelectionColor(item))}>
                          <Store className="size-3.5" />
                          {getSelectionLabel(item)}
                        </span>
                        {item.createdAt && (
                          <span className="flex items-center gap-1.5 ms-auto">
                            <Calendar className="size-3.5 text-fog/40" />
                            {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                        {item.finalizedAt && key === "completed" && (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="size-3.5 text-emerald-400" />
                            {new Date(item.finalizedAt).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <FinalizeModal
        open={!!finalizePR}
        onOpenChange={(open) => { if (!open) setFinalizePR(null); }}
        pr={finalizePR}
        onSuccess={handleFinalizeSuccess}
      />

      <ConfirmDialog
        open={!!payPR}
        onOpenChange={(open) => { if (!open) setPayPR(null); }}
        title="ارسال به واحد مالی"
        description={
          payPR && paymentOrdersByPRId[payPR._id]
            ? `آیا از ارسال "${payPR.title || "بدون عنوان"}" به واحد مالی برای پرداخت ${Number(paymentOrdersByPRId[payPR._id].amount || 0).toLocaleString("fa-IR")} ریال اطمینان دارید؟`
            : ""
        }
        confirmLabel="ارسال به مالی"
        onConfirm={handleSendToFinance}
        loading={paying}
      />
    </div>
  );
}
