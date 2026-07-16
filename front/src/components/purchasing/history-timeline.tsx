import { Check, X, Clock, Send, RotateCcw, Circle, Package, ShoppingBag, CreditCard, Store, Pencil, History, FileCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryPerformer {
  by?: string;
  name?: string;
  at?: string;
  role?: { id?: string; name?: string; scopeType?: string; scopeId?: string };
}

interface HistoryEntry {
  action?: string;
  performed?: HistoryPerformer;
  unit?: { _id?: string; name?: string };
  details?: Record<string, unknown>;
}

interface HistoryTimelineProps {
  history: HistoryEntry[];
}

const actionConfig: Record<string, { icon: typeof History; label: string; color: string }> = {
  submitted: { icon: Send, label: "درخواست ثبت شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/20" },
  Approved: { icon: Check, label: "تأیید شده", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20" },
  Rejected: { icon: X, label: "رد شده", color: "bg-rose-500/15 text-rose-400 ring-rose-500/20" },
  Submitted: { icon: Send, label: "ارسال شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/20" },
  Submit: { icon: Send, label: "ارسال شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/20" },
  Pending: { icon: Clock, label: "در انتظار بررسی", color: "bg-amber-500/15 text-amber-400 ring-amber-500/20" },
  goods_received: { icon: Package, label: "کالا دریافت شد", color: "bg-teal-500/15 text-teal-400 ring-teal-500/20" },
  goods_consumed: { icon: ShoppingBag, label: "کالا مصرف شد", color: "bg-orange-500/15 text-orange-400 ring-orange-500/20" },
  step_approved: { icon: UserCheck, label: "گام تأیید شد", color: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/20" },
  item_assigned: { icon: Store, label: "محصول تخصیص یافت", color: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/20" },
  Consumed: { icon: ShoppingBag, label: "مصرف شد", color: "bg-orange-500/15 text-orange-400 ring-orange-500/20" },
  PaymentInitiated: { icon: CreditCard, label: "پرداخت آغاز شد", color: "bg-violet-500/15 text-violet-400 ring-violet-500/20" },
  assigned: { icon: Store, label: "فروشگاه تخصیص یافت", color: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/20" },
  Updated: { icon: Pencil, label: "به‌روزرسانی شد", color: "bg-gray-500/15 text-gray-400 ring-gray-500/20" },
  Update: { icon: Pencil, label: "به‌روزرسانی شد", color: "bg-gray-500/15 text-gray-400 ring-gray-500/20" },
  Created: { icon: Clock, label: "ایجاد شد", color: "bg-white/[0.05] text-fog/40 ring-steel-border/20" },
  Add: { icon: Clock, label: "ایجاد شد", color: "bg-white/[0.05] text-fog/40 ring-steel-border/20" },
  Draft: { icon: FileCheck, label: "پیش‌نویس", color: "bg-white/[0.05] text-fog/40 ring-steel-border/20" },
  add: { icon: Clock, label: "ایجاد شد", color: "bg-white/[0.05] text-fog/40 ring-steel-border/20" },
  Receive: { icon: Package, label: "دریافت کالا", color: "bg-teal-500/15 text-teal-400 ring-teal-500/20" },
  request_submitted: { icon: Send, label: "درخواست ارسال شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/20" },
};

function getConfig(action?: string) {
  return actionConfig[action || ""] || { icon: Circle, label: action || "اقدام", color: "bg-white/[0.03] text-fog/40 ring-steel-border/20" };
}

function formatPersianDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("fa-IR"),
    time: d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    full: d,
  };
}

function groupByDate(entries: HistoryEntry[]) {
  const groups: { dateKey: string; label: string; entries: HistoryEntry[] }[] = [];
  for (const entry of entries) {
    if (!entry.performed?.at) continue;
    const { date } = formatPersianDate(entry.performed.at);
    const existing = groups.find((g) => g.dateKey === date);
    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.push({ dateKey: date, label: date, entries: [entry] });
    }
  }
  return groups;
}

function renderDetails(entry: HistoryEntry) {
  const d = entry.details;
  if (!d || Object.keys(d).length === 0) return null;
  const action = entry.action || "";

  const items: string[] = [];

  if (action === "submitted") {
    if (d.status) items.push(`وضعیت: ${String(d.status)}`);
    if (d.currentStep != null) items.push(`گام: ${Number(d.currentStep)}`);
  } else if (action === "item_assigned") {
    if (d.wareModelName) items.push(`کالا: ${d.wareModelName}`);
    if (d.quantity) items.push(`تعداد: ${Number(d.quantity).toLocaleString("fa-IR")}`);
    if (d.unitPrice) items.push(`قیمت واحد: ${Number(d.unitPrice).toLocaleString("fa-IR")} تومان`);
    if (d.assignedFromId) items.push(`فروشگاه: ${String(d.assignedFromId)}`);
    if (d.storeId && !d.assignedFromId) items.push(`فروشگاه: ${String(d.storeId)}`);
    if (d.tenderOfferId) items.push(`پیشنهاد: ${String(d.tenderOfferId)}`);
  } else if (action === "step_approved" || action === "Approved") {
    if (d.stepName) items.push(`گام: ${d.stepName}`);
    if (d.unitId && entry.unit?.name) items.push(`واحد: ${entry.unit.name}`);
    if (d.comment) items.push(`نظر: ${d.comment}`);
    if (d.completed) items.push("تکمیل نهایی");
  } else if (action === "goods_received" || action === "Receive") {
    if (d.goodsReceiptId) items.push(`رسید: ${String(d.goodsReceiptId)}`);
    if (d.itemCount) items.push(`تعداد اقلام: ${Number(d.itemCount).toLocaleString("fa-IR")}`);
    if (d.wareModelName) items.push(`کالا: ${d.wareModelName}`);
    if (d.quantity) items.push(`مقدار: ${Number(d.quantity).toLocaleString("fa-IR")}`);
    if (d.receivingUnitId && entry.unit?.name) items.push(`واحد دریافت: ${entry.unit.name}`);
  } else if (action === "goods_consumed" || action === "Consumed") {
    if (d.wareModelName) items.push(`کالا: ${d.wareModelName}`);
    if (d.quantity) items.push(`مقدار: ${Number(d.quantity).toLocaleString("fa-IR")}`);
    if (d.consumptionRecordId) items.push(`مصرف: ${String(d.consumptionRecordId)}`);
  } else if (action === "assigned") {
    if (d.storeName) items.push(`فروشگاه: ${d.storeName}`);
    if (d.wareModelName) items.push(`کالا: ${d.wareModelName}`);
  } else if (action === "PaymentInitiated") {
    if (d.amount) items.push(`مبلغ: ${Number(d.amount).toLocaleString("fa-IR")} تومان`);
  }

  for (const [key, val] of Object.entries(d)) {
    if (["wareModelName", "quantity", "unitPrice", "storeId", "assignedFromId", "stepName", "comment", "itemCount", "storeName", "amount", "wareModelId", "goodsReceiptId", "consumptionRecordId", "tenderOfferId", "receivingUnitId", "stepIndex", "_id", "status", "currentStep", "completed"].includes(key)) continue;
    if (typeof val === "string" && val.length < 80) {
      items.push(`${key}: ${val}`);
    } else if (typeof val === "number") {
      items.push(`${key}: ${val.toLocaleString("fa-IR")}`);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-0.5">
      {items.map((text, i) => (
        <p key={i} className="text-[11px] text-fog/30 leading-5">{text}</p>
      ))}
    </div>
  );
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
          <History className="size-5 text-fog/40" />
        </div>
        <p className="text-sm text-fog/50">تاریخچه‌ای ثبت نشده است</p>
      </div>
    );
  }

  const sorted = [...history]
    .filter((h) => h.performed?.at)
    .sort((a, b) => new Date(b.performed!.at!).getTime() - new Date(a.performed!.at!).getTime());

  const grouped = groupByDate(sorted);

  const isLatest = (globalIndex: number) => globalIndex === 0;

  const allEntriesFlat = grouped.flatMap((g) => g.entries);
  let globalIdx = 0;

  return (
    <div className="rounded-xl border border-steel-border/15 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
          <History className="size-4 text-electric-iris" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-moonlight">تاریخچه رویدادها</h3>
          <p className="text-[11px] text-fog/40">{allEntriesFlat.length} رویداد</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute start-[17px] top-1 bottom-1 w-px bg-gradient-to-b from-frost-link/20 via-steel-border/20 to-transparent" />

        {grouped.map((group, groupIndex) => (
          <div key={group.dateKey} className={cn(groupIndex > 0 && "mt-6")}>
            <div className="flex items-center gap-2 mb-3 me-0 ms-[34px]">
              <div className="h-px flex-1 bg-steel-border/10" />
              <span className="text-[11px] font-medium text-fog/30 tracking-wide">{group.label}</span>
              <div className="h-px flex-1 bg-steel-border/10" />
            </div>

            <div className="space-y-0">
              {group.entries.map((entry, entryIndex) => {
                const { icon: Icon, label, color } = getConfig(entry.action);
                const performer = entry.performed;
                const dt = performer?.at ? formatPersianDate(performer.at) : null;
                const thisGlobalIdx = globalIdx++;

                return (
                  <div
                    key={`${group.dateKey}-${entryIndex}`}
                    className="relative flex items-start gap-4 pb-4 last:pb-0 group"
                  >
                    <div className="relative z-[1] shrink-0">
                      <div
                        className={cn(
                          "size-[34px] rounded-full flex items-center justify-center ring-1 transition-all duration-300",
                          color,
                          isLatest(thisGlobalIdx) && "ring-2 ring-offset-[1.5px] ring-offset-[#05060f]",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      {isLatest(thisGlobalIdx) && (
                        <span className="absolute -inset-1 rounded-full animate-ping bg-frost-link/10 pointer-events-none" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-moonlight leading-5">{label}</p>
                          {performer?.name && (
                            <p className="text-xs text-fog/50 mt-0.5 flex items-center gap-1.5">
                              <span className="size-1 rounded-full bg-fog/20" />
                              {performer.name}
                            </p>
                          )}
                          {performer?.role?.name && (
                            <p className="text-[11px] text-fog/30 mt-0.5 flex items-center gap-1.5">
                              <span className="size-1 rounded-full bg-fog/15" />
                              {performer.role.name}
                              {performer.role.scopeType && (
                                <span className="text-fog/20">
                                  — {performer.role.scopeType === "organization" ? "سازمان" : performer.role.scopeType === "unit" ? "واحد" : performer.role.scopeType === "department" ? "دپارتمان" : performer.role.scopeType}
                                </span>
                              )}
                            </p>
                          )}
                          {renderDetails(entry)}
                        </div>

                        {dt && (
                          <div className="shrink-0 text-end pt-0.5">
                            <p className="text-[11px] font-medium text-fog/30 font-mono" dir="ltr">
                              {dt.time}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
