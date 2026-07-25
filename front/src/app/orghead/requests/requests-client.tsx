"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, List, Eye, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge";
import { RequestCard } from "@/components/purchasing/request-card";
import { FinalizeModal } from "@/components/orghead/finalize-modal";

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
}

const TAB_KEYS = ["pending", "completed", "all"] as const;

const TAB_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
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
}: RequestsClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(false);
  const [finalizePR, setFinalizePR] = useState<PurchasingRequest | null>(null);

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

  const columns: Column<PurchasingRequest>[] = [
    {
      key: "title",
      label: "عنوان",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-3.5 text-electric-iris" />
          </div>
          <div className="min-w-0">
            <span className="text-moonlight font-medium">{item.title || "—"}</span>
            {item.organization?.name && (
              <p className="text-fog/50 text-xs mt-0.5">{item.organization.name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "requestingUnit",
      label: "واحد درخواست‌کننده",
      render: (item) => (
        <span className="text-fog text-sm">{item.requestingUnit?.name || "—"}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "wareModel",
      label: "مدل کالا",
      render: (item) => (
        <span className="text-fog text-sm">{item.wareModel?.name || "—"}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "quantity",
      label: "مقدار",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "selectionType",
      label: "وضعیت انتخاب",
      render: (item) => (
        <span className={`text-sm ${getSelectionColor(item)}`}>
          {getSelectionLabel(item)}
        </span>
      ),
    },
    {
      key: "estimatedAmount",
      label: "مبلغ تخمینی",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.estimatedAmount != null ? `${item.estimatedAmount.toLocaleString("fa-IR")} ریال` : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "createdAt",
      label: "تاریخ ایجاد",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "finalizedAt",
      label: "تاریخ نهایی‌سازی",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.finalizedAt ? new Date(item.finalizedAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "actions",
      label: "",
      render: (item) => {
        if (item.status === "PendingFinalization") {
          return (
            <Button
              variant="outline"
              size="xs"
              className="gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setFinalizePR(item);
              }}
            >
              <Clock className="size-3.5" />
              تأیید نهایی
            </Button>
          );
        }
        return (
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => router.push(`/orghead/requests/${item._id}`)}
          >
            <Eye className="size-3.5" />
          </Button>
        );
      },
    },
  ];

  const activeTabIndex = TAB_KEYS.indexOf(activeTab as typeof TAB_KEYS[number]) !== -1
    ? activeTab
    : "pending";

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
            <DataTable
              columns={columns.filter((col) => {
                if (key !== "completed" && col.key === "finalizedAt") return false;
                return true;
              })}
              data={items}
              keyExtractor={(item) => item._id}
              cardView={cardView}
              onViewToggle={() => setCardView((v) => !v)}
              renderCard={(item) => (
                <RequestCard
                  title={item.title}
                  status={item.status}
                  quantity={item.quantity}
                  estimatedAmount={item.estimatedAmount}
                  createdAt={item.createdAt}
                  onClick={() => {
                    if (item.status === "PendingFinalization") {
                      setFinalizePR(item);
                    } else {
                      router.push(`/orghead/requests/${item._id}`);
                    }
                  }}
                />
              )}
              emptyTitle="درخواستی یافت نشد"
              emptyDescription={
                key === "pending"
                  ? "هیچ درخواستی در انتظار تأیید نهایی نیست."
                  : key === "completed"
                    ? "هیچ درخواست تکمیل شده‌ای یافت نشد."
                    : "هیچ درخواست خریدی برای سازمان شما یافت نشد."
              }
            />
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
    </div>
  );
}
