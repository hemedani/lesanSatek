"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Clock, CheckCircle, ShieldCheck, Store, Building2,
  Package, DollarSign, CalendarDays, User, Workflow, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FinalizeModal } from "@/components/orghead/finalize-modal";
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge";
import { RequestsFilterBar } from "@/app/requests/requests-filter-bar";
import type { FilterOption } from "@/components/ui/filter-select";
import { update as updatePaymentOrder } from "@/app/actions/paymentOrder/update";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Unit { _id: string; name?: string; }
interface WareModel { _id: string; name?: string; }
interface Organization { _id: string; name?: string; }
interface Requester { _id?: string; first_name?: string; last_name?: string; }
interface ProcessRef { _id?: string; name?: string; }
interface PaymentOrder { _id: string; title?: string; amount?: number; status?: string; }

export interface PurchasingRequest {
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
  requester?: Requester;
  wareModel?: WareModel;
  process?: ProcessRef;
  organization?: Organization;
}

export interface ProcessOption { _id: string; name?: string; status?: string; }
export interface RequestCounts {
  total: number;
  totalPending: number;
  payment: number;
  completed: number;
}

interface RequestsClientProps {
  items: PurchasingRequest[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  totalPages?: number;
  activeTab: string;
  counts: RequestCounts;
  processes: ProcessOption[];
  search: string;
  status: string;
  processId: string;
  sort: "asc" | "desc";
  paymentOrdersByPRId?: Record<string, PaymentOrder>;
}

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
  totalPages,
  activeTab,
  counts,
  processes,
  search,
  status,
  processId,
  sort,
  paymentOrdersByPRId = {},
}: RequestsClientProps) {
  const router = useRouter();
  const [finalizePR, setFinalizePR] = useState<PurchasingRequest | null>(null);
  const [payPR, setPayPR] = useState<PurchasingRequest | null>(null);
  const [paying, setPaying] = useState(false);

  const makeParams = useCallback(
    (next: { search?: string; status?: string; processId?: string; sort?: string }) => {
      const params = new URLSearchParams();
      params.set("tab", next.status ? "all" : activeTab);
      const nextSearch = (next.search ?? search).trim();
      const nextStatus = next.status ?? status;
      const nextProcessId = next.processId ?? processId;
      const nextSort = next.sort ?? sort;
      if (nextSearch) params.set("search", nextSearch);
      if (nextStatus) params.set("status", nextStatus);
      if (nextProcessId) params.set("processId", nextProcessId);
      if (nextSort === "asc") params.set("sort", "asc");
      return params.toString();
    },
    [activeTab, search, status, processId, sort],
  );

  const go = useCallback(
    (qs: string) => router.push(`/orghead/requests${qs ? `?${qs}` : ""}`),
    [router],
  );

  const handleSearch = (value: string) => go(makeParams({ search: value }));
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }));
  const handleProcess = (value: string | null) => go(makeParams({ processId: value ?? "" }));
  const handleSort = (value: string | null) => go(makeParams({ sort: value === "asc" ? "asc" : "desc" }));
  const handleReset = () => go(makeParams({ search: "", status: "", processId: "", sort: "desc" }));

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      params.set("tab", value);
      if (search) params.set("search", search);
      router.push(`/orghead/requests?${params.toString()}`);
    },
    [router, search],
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

  const processOptions: FilterOption[] = processes.map((p) => ({
    value: p._id,
    label: p.name || "بدون نام",
  }));

  const hasActiveFilters = Boolean(search || status || processId || sort === "asc");

  const statItems = [
    {
      key: "all", tab: "all", label: "همه درخواست‌ها", value: counts.total,
      icon: ShoppingCart, iconColor: "text-electric-iris", iconBg: "bg-electric-iris/10",
      subtitle: "مجموع درخواست‌های سازمان",
    },
    {
      key: "pending", tab: "pending", label: "در انتظار تأیید نهایی", value: counts.totalPending,
      icon: Clock, iconColor: "text-amber-400", iconBg: "bg-amber-400/10",
      subtitle: "نیازمند اقدام شما",
    },
    {
      key: "payment", tab: "payment", label: "نیازمند پرداخت", value: counts.payment,
      icon: Wallet, iconColor: "text-rose-400", iconBg: "bg-rose-400/10",
      subtitle: "در انتظار ارسال به مالی",
    },
    {
      key: "completed", tab: "completed", label: "تکمیل شده", value: counts.completed,
      icon: CheckCircle, iconColor: "text-emerald-400", iconBg: "bg-emerald-400/10",
      subtitle: "نهایی شده",
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="درخواست‌های خرید"
          description="مدیریت و نهایی‌سازی درخواست‌های خرید سازمان"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {statItems.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
            iconBg={stat.iconBg}
            subtitle={stat.subtitle}
            active={activeTab === stat.tab}
            onClick={() => handleTabChange(stat.tab)}
          />
        ))}
      </div>

      <RequestsFilterBar
        search={search}
        onSearchChange={handleSearch}
        status={status}
        onStatusChange={handleStatus}
        processId={processId}
        onProcessChange={handleProcess}
        processOptions={processOptions}
        sort={sort}
        onSortChange={handleSort}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
      />

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <RequestCard
              key={item._id}
              item={item}
              isPayTab={activeTab === "payment"}
              paymentOrder={paymentOrdersByPRId[item._id]}
              onOpen={() => {
                if (item.status === "PendingFinalization") {
                  setFinalizePR(item);
                } else {
                  router.push(`/orghead/requests/${item._id}`);
                }
              }}
              onSendToFinance={() => setPayPR(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title="درخواستی یافت نشد"
          description={hasActiveFilters
            ? "با تغییر فیلترها یا پاک کردن جستجو، درخواست موردنظر را پیدا کنید."
            : "هیچ درخواست خریدی برای سازمان شما یافت نشد."}
        />
      )}

      {(prevPageUrl || nextPageUrl) && (
        <Pagination
          prevUrl={prevPageUrl}
          nextUrl={nextPageUrl}
          page={page}
          totalPages={totalPages}
          className="pt-2 border-t border-steel-border/15"
        />
      )}

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

interface RequestCardProps {
  item: PurchasingRequest;
  isPayTab: boolean;
  paymentOrder?: PaymentOrder;
  onOpen: () => void;
  onSendToFinance: () => void;
}

function RequestCard({ item, isPayTab, paymentOrder, onOpen, onSendToFinance }: RequestCardProps) {
  const requesterName = item.requester
    ? [item.requester.first_name, item.requester.last_name].filter(Boolean).join(" ")
    : "";

  return (
    <div
      className="group block h-full rounded-2xl outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onOpen}
    >
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
              <ShieldCheck className="size-5 text-electric-iris" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                {item.title || "درخواست خرید"}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.process?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    <Workflow className="size-3.5" />
                    {item.process.name}
                  </span>
                )}
                {item.organization?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    <Building2 className="size-3.5" />
                    {item.organization.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <RequestStatusBadge status={item.status} />
            {item.status === "PendingFinalization" && (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 h-8 px-3"
                onClick={(e) => { e.stopPropagation(); onOpen(); }}
              >
                <Clock className="size-4" />
                تأیید نهایی
              </Button>
            )}
            {isPayTab && paymentOrder && (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 h-8 px-3"
                onClick={(e) => { e.stopPropagation(); onSendToFinance(); }}
              >
                <Wallet className="size-4" />
                ارسال به مالی
              </Button>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          {requesterName && (
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-fog/60" />
              {requesterName}
            </span>
          )}
          {item.requestingUnit?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4 text-fog/60" />
              {item.requestingUnit.name}
            </span>
          )}
          {item.wareModel?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4 text-fog/60" />
              {item.wareModel.name}
            </span>
          )}
          {item.quantity != null && (
            <span className="inline-flex items-center gap-1.5">
              <ShoppingCart className="size-4 text-fog/60" />
              {item.quantity.toLocaleString("fa-IR")} عدد
            </span>
          )}
          {item.estimatedAmount != null && (
            <span className="inline-flex items-center gap-1.5 text-pebble">
              <DollarSign className="size-4 text-fog/60" />
              {item.estimatedAmount.toLocaleString("fa-IR")} ریال
            </span>
          )}
          <span className={cn("inline-flex items-center gap-1.5", getSelectionColor(item))}>
            <Store className="size-4" />
            {getSelectionLabel(item)}
          </span>
          {isPayTab && paymentOrder && paymentOrder.amount != null && (
            <span className="inline-flex items-center gap-1.5 text-amber-400">
              <Wallet className="size-4" />
              پرداخت: {paymentOrder.amount.toLocaleString("fa-IR")} ریال
            </span>
          )}
          {item.createdAt && (
            <span className={cn("inline-flex items-center gap-1.5", requesterName && "ms-auto")}>
              <CalendarDays className="size-4 text-fog/60" />
              {new Date(item.createdAt).toLocaleDateString("fa-IR")}
            </span>
          )}
          {item.finalizedAt && (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="size-4 text-emerald-400" />
              {new Date(item.finalizedAt).toLocaleDateString("fa-IR")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}