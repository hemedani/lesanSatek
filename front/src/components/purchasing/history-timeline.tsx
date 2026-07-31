"use client"

import { useEffect, useState } from "react";
import {
  Check,
  X,
  Clock,
  Send,
  Circle,
  Package,
  ShoppingBag,
  CreditCard,
  Store,
  Pencil,
  History,
  FileCheck,
  UserCheck,
  Award,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { get as getUnit } from "@/app/actions/unit/get";
import { get as getStore } from "@/app/actions/store/get";
import { get as getTender } from "@/app/actions/tender/get";
import { get as getTenderOffer } from "@/app/actions/tenderOffer/get";
import { get as getWareModel } from "@/app/actions/wareModel/get";
import { get as getWare } from "@/app/actions/ware/get";
import { get as getStuff } from "@/app/actions/stuff/get";
import { get as getGoodsReceipt } from "@/app/actions/goodsReceipt/get";
import { get as getConsumption } from "@/app/actions/consumption/get";
import { get as getPaymentOrder } from "@/app/actions/paymentOrder/get";
import { get as getProcess } from "@/app/actions/process/get";
import { get as getProcessStep } from "@/app/actions/processStep/get";
import { get as getOrganization } from "@/app/actions/organization/get";
import { get as getFile } from "@/app/actions/file/get";
import { getUser } from "@/app/actions/user/getUser";

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
  submitted: { icon: Send, label: "درخواست ثبت شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/25" },
  created: { icon: Clock, label: "ایجاد شد", color: "bg-white/[0.05] text-fog/60 ring-steel-border/25" },
  Approved: { icon: Check, label: "تأیید شده", color: "bg-cipher-mint/15 text-cipher-mint ring-cipher-mint/25" },
  Rejected: { icon: X, label: "رد شده", color: "bg-rose-500/15 text-rose-400 ring-rose-500/25" },
  Submitted: { icon: Send, label: "ارسال شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/25" },
  Submit: { icon: Send, label: "ارسال شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/25" },
  Pending: { icon: Clock, label: "در انتظار بررسی", color: "bg-amber-500/15 text-amber-400 ring-amber-500/25" },
  goods_received: { icon: Package, label: "کالا دریافت شد", color: "bg-teal-500/15 text-teal-400 ring-teal-500/25" },
  goods_consumed: { icon: ShoppingBag, label: "کالا مصرف شد", color: "bg-orange-500/15 text-orange-400 ring-orange-500/25" },
  step_approved: { icon: UserCheck, label: "گام تأیید شد", color: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25" },
  step_rejected: { icon: X, label: "گام رد شد", color: "bg-rose-500/15 text-rose-400 ring-rose-500/25" },
  item_assigned: { icon: Store, label: "محصول تخصیص یافت", color: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/25" },
  stuff_assigned: { icon: Store, label: "کالا تخصیص یافت", color: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/25" },
  stuff_status_updated: { icon: Pencil, label: "وضعیت کالا به‌روزرسانی شد", color: "bg-gray-500/15 text-gray-400 ring-gray-500/25" },
  stuff_removed: { icon: X, label: "کالا از خرید حذف شد", color: "bg-rose-500/15 text-rose-400 ring-rose-500/25" },
  Consumed: { icon: ShoppingBag, label: "مصرف شد", color: "bg-orange-500/15 text-orange-400 ring-orange-500/25" },
  PaymentInitiated: { icon: CreditCard, label: "پرداخت آغاز شد", color: "bg-violet-500/15 text-violet-400 ring-violet-500/25" },
  payment_ordered: { icon: CreditCard, label: "دستور پرداخت صادر شد", color: "bg-violet-500/15 text-violet-400 ring-violet-500/25" },
  assigned: { icon: Store, label: "فروشگاه تخصیص یافت", color: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/25" },
  Updated: { icon: Pencil, label: "به‌روزرسانی شد", color: "bg-gray-500/15 text-gray-400 ring-gray-500/25" },
  Update: { icon: Pencil, label: "به‌روزرسانی شد", color: "bg-gray-500/15 text-gray-400 ring-gray-500/25" },
  Created: { icon: Clock, label: "ایجاد شد", color: "bg-white/[0.05] text-fog/60 ring-steel-border/25" },
  Add: { icon: Clock, label: "ایجاد شد", color: "bg-white/[0.05] text-fog/60 ring-steel-border/25" },
  Draft: { icon: FileCheck, label: "پیش‌نویس", color: "bg-white/[0.05] text-fog/60 ring-steel-border/25" },
  add: { icon: Clock, label: "ایجاد شد", color: "bg-white/[0.05] text-fog/60 ring-steel-border/25" },
  Receive: { icon: Package, label: "دریافت کالا", color: "bg-teal-500/15 text-teal-400 ring-teal-500/25" },
  request_submitted: { icon: Send, label: "درخواست ارسال شد", color: "bg-sky-500/15 text-sky-400 ring-sky-500/25" },
  tender_created: { icon: FileText, label: "مناقصه ایجاد شد", color: "bg-violet-500/15 text-violet-400 ring-violet-500/25" },
  tender_offer_selected: { icon: Check, label: "پیشنهاد مناقصه انتخاب شد", color: "bg-cipher-mint/15 text-cipher-mint ring-cipher-mint/25" },
  tender_awarded: { icon: Award, label: "مناقصه اعطا شد", color: "bg-amber-500/15 text-amber-400 ring-amber-500/25" },
  tender_offer_removed: { icon: X, label: "انتخاب مناقصه لغو شد", color: "bg-rose-500/15 text-rose-400 ring-rose-500/25" },
  all_steps_approved: { icon: Check, label: "همه گام‌ها تأیید شد", color: "bg-cipher-mint/15 text-cipher-mint ring-cipher-mint/25" },
  finalized: { icon: FileCheck, label: "نهایی‌سازی شد", color: "bg-violet-500/15 text-violet-400 ring-violet-500/25" },
};

function getConfig(action?: string) {
  return actionConfig[action || ""] || { icon: Circle, label: action || "اقدام", color: "bg-white/[0.04] text-fog/60 ring-steel-border/25" };
}

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس فروشگاه",
};

const scopeLabelMap: Record<string, string> = {
  organization: "سازمان",
  unit: "واحد",
  department: "دپارتمان",
  store: "فروشگاه",
};

const statusLabelMap: Record<string, string> = {
  Pending: "در انتظار بررسی",
  Draft: "پیش‌نویس",
  Approved: "تأیید شده",
  Rejected: "رد شده",
  InProgress: "در حال انجام",
  Completed: "تکمیل شده",
  Submitted: "ارسال شده",
};

const stepTypeLabelMap: Record<string, string> = {
  Approval: "تأیید",
  Review: "بررسی",
  Notification: "اطلاع‌رسانی",
  Action: "اقدام",
  Delivery: "تحویل",
  Receipt: "دریافت",
  Payment: "پرداخت",
};

const stuffStatusLabelMap: Record<string, string> = {
  assigned: "تخصیص داده شده",
  ready_to_ship: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  received: "دریافت شده",
  cancelled: "لغو شده",
};

const finalWinnerLabelMap: Record<string, string> = {
  stuff: "کالا",
  tender: "مناقصه",
};

const pricingModeLabelMap: Record<string, string> = {
  absolute: "قیمت قطعی",
  percentage: "درصدی",
  base: "پایه",
};

function scopeLabel(scopeType?: string): string {
  return scopeType ? (scopeLabelMap[scopeType] || "") : "";
}

function roleLabel(name?: string): string {
  return name ? (roleLabelMap[name] || "") : "";
}

function formatPersianDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("fa-IR"),
    time: d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    full: d,
  };
}

function faNum(n: number): string {
  return n.toLocaleString("fa-IR");
}

function initialsOf(name?: string): string {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[1][0] || "" : "";
  return `${first}${last}`.trim();
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

const isObjectId = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

type ResolverModel =
  | "user"
  | "unit"
  | "store"
  | "tender"
  | "tenderOffer"
  | "wareModel"
  | "ware"
  | "stuff"
  | "goodsReceipt"
  | "consumption"
  | "paymentOrder"
  | "process"
  | "processStep"
  | "organization"
  | "file";

interface DetailItem {
  label: string;
  value?: string;
  ref?: { model: ResolverModel; id: string };
}

const idFieldMap: Record<string, { label: string; model: ResolverModel }> = {
  storeId: { label: "فروشگاه", model: "store" },
  assignedFromId: { label: "فروشگاه", model: "store" },
  winningStoreId: { label: "فروشگاه برنده", model: "store" },
  previousStoreId: { label: "فروشگاه قبلی", model: "store" },
  tenderId: { label: "مناقصه", model: "tender" },
  tenderOfferId: { label: "پیشنهاد", model: "tenderOffer" },
  previousTenderOfferId: { label: "پیشنهاد قبلی", model: "tenderOffer" },
  wareModelId: { label: "مدل کالا", model: "wareModel" },
  wareId: { label: "کالا", model: "ware" },
  stuffId: { label: "کالا", model: "stuff" },
  previousStuffId: { label: "کالای قبلی", model: "stuff" },
  goodsReceiptId: { label: "رسید", model: "goodsReceipt" },
  consumptionId: { label: "سند مصرف", model: "consumption" },
  consumptionRecordId: { label: "سند مصرف", model: "consumption" },
  paymentOrderId: { label: "دستور پرداخت", model: "paymentOrder" },
  unitId: { label: "واحد", model: "unit" },
  receivingUnitId: { label: "واحد دریافت", model: "unit" },
  processId: { label: "فرآیند", model: "process" },
  processStepId: { label: "گام فرآیند", model: "processStep" },
  organizationId: { label: "سازمان", model: "organization" },
  fileId: { label: "فایل", model: "file" },
  performedBy: { label: "انجام‌دهنده", model: "user" },
};

const enumFieldMap: Record<string, { label: string; map: Record<string, string> }> = {
  status: { label: "وضعیت", map: statusLabelMap },
  stepType: { label: "نوع گام", map: stepTypeLabelMap },
  stuffStatus: { label: "وضعیت کالا", map: stuffStatusLabelMap },
  finalWinner: { label: "برنده نهایی", map: finalWinnerLabelMap },
  pricingMode: { label: "شیوه قیمت‌گذاری", map: pricingModeLabelMap },
  scopeType: { label: "محدوده", map: scopeLabelMap },
};

const plainFieldMap: Record<string, { label: string; format?: "date" | "number" }> = {
  offerDeliveryTime: { label: "زمان تحویل (روز)", format: "number" },
  offerPaymentTerms: { label: "شرایط پرداخت" },
  pendingFinalization: { label: "نهایی‌سازی" },
  deadline: { label: "مهلت", format: "date" },
  currentStep: { label: "گام فعلی", format: "number" },
  stepIndex: { label: "شماره گام", format: "number" },
};

function firstOf(res: { success?: boolean; body?: unknown }, field: string): string | null {
  if (!res?.success) return null;
  const body = res.body;
  const item = Array.isArray(body) ? (body as Record<string, unknown>[])[0] : (body as Record<string, unknown>);
  const value = item?.[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nestedName(
  res: { success?: boolean; body?: unknown },
  ...path: string[]
): string | null {
  if (!res?.success) return null;
  const body = res.body;
  let current: unknown = Array.isArray(body) ? (body as Record<string, unknown>[])[0] : body;
  for (const key of path) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

async function resolveEntityLabel(model: ResolverModel, id: string): Promise<string | null> {
  try {
    switch (model) {
      case "user": {
        const res = await getUser({ _id: id }, { _id: 1, first_name: 1, last_name: 1 });
        if (!res?.success) return null;
        const body = res.body;
        const item = Array.isArray(body) ? (body as Record<string, unknown>[])[0] : (body as Record<string, unknown>);
        const name = [item?.first_name, item?.last_name].filter(Boolean).join(" ").trim();
        return name || null;
      }
      case "unit":
        return firstOf(await getUnit({ _id: id }, { _id: 1, name: 1 }), "name");
      case "store":
        return firstOf(await getStore({ _id: id }, { _id: 1, name: 1 }), "name");
      case "tender":
        return firstOf(await getTender({ _id: id }, { _id: 1, title: 1 }), "title");
      case "tenderOffer": {
        const res = await getTenderOffer({ _id: id }, { _id: 1, store: { name: 1 } });
        return nestedName(res, "store", "name");
      }
      case "wareModel":
        return firstOf(await getWareModel({ _id: id }, { _id: 1, name: 1 }), "name");
      case "ware":
        return firstOf(await getWare({ _id: id }, { _id: 1, name: 1 }), "name");
      case "stuff": {
        const res = await getStuff({ _id: id }, { _id: 1, store: { name: 1 }, wareModel: { name: 1 } });
        return nestedName(res, "store", "name") || nestedName(res, "wareModel", "name");
      }
      case "goodsReceipt":
        return firstOf(await getGoodsReceipt({ _id: id }, { _id: 1, receiptNumber: 1 }), "receiptNumber");
      case "consumption": {
        const res = await getConsumption({ _id: id }, { _id: 1, reason: 1, consumedAt: 1 });
        return firstOf(res, "reason");
      }
      case "paymentOrder":
        return firstOf(await getPaymentOrder({ _id: id }, { _id: 1, title: 1 }), "title");
      case "process":
        return firstOf(await getProcess({ _id: id }, { _id: 1, name: 1 }), "name");
      case "processStep":
        return firstOf(await getProcessStep({ _id: id }, { _id: 1, name: 1 }), "name");
      case "organization":
        return firstOf(await getOrganization({ _id: id }, { _id: 1, name: 1 }), "name");
      case "file":
        return firstOf(await getFile({ _id: id }, { _id: 1, name: 1 }), "name");
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function EntityName({ model, id }: { model: ResolverModel; id: string }) {
  const [label, setLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    resolveEntityLabel(model, id).then((result) => {
      if (cancelled) return;
      setLabel(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [model, id]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-fog/70">
        <Loader2 className="size-3.5 shrink-0 animate-spin text-fog/50" />
        در حال بارگذاری…
      </span>
    );
  }
  return <span>{label ?? "اطلاعات در دسترس نیست"}</span>;
}

function computeDetailItems(entry: HistoryEntry): DetailItem[] {
  const d = entry.details;
  if (!d || Object.keys(d).length === 0) return [];
  const action = entry.action || "";

  const items: DetailItem[] = [];

  if (action === "submitted") {
    if (typeof d.status === "string" && statusLabelMap[d.status]) {
      items.push({ label: "وضعیت", value: statusLabelMap[d.status] });
    }
    if (typeof d.currentStep === "number") {
      items.push({ label: "گام", value: faNum(d.currentStep) });
    }
  } else if (action === "item_assigned" || action === "stuff_assigned") {
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
    if (typeof d.quantity === "number") items.push({ label: "تعداد", value: faNum(d.quantity) });
    if (typeof d.unitPrice === "number") items.push({ label: "قیمت واحد", value: `${faNum(d.unitPrice)} تومان` });
    if (isObjectId(d.assignedFromId)) items.push({ label: "فروشگاه", ref: { model: "store", id: d.assignedFromId } });
    else if (isObjectId(d.storeId)) items.push({ label: "فروشگاه", ref: { model: "store", id: d.storeId } });
    if (typeof d.storeName === "string" && d.storeName) items.push({ label: "فروشگاه", value: d.storeName });
    if (isObjectId(d.tenderOfferId)) items.push({ label: "پیشنهاد", ref: { model: "tenderOffer", id: d.tenderOfferId } });
  } else if (action === "step_approved" || action === "step_rejected" || action === "Approved" || action === "Rejected" || action === "all_steps_approved") {
    if (typeof d.stepName === "string" && d.stepName) items.push({ label: "گام", value: d.stepName });
    if (isObjectId(d.unitId)) items.push({ label: "واحد", ref: { model: "unit", id: d.unitId } });
    else if (entry.unit?.name) items.push({ label: "واحد", value: entry.unit.name });
    if (typeof d.comment === "string" && d.comment) items.push({ label: "نظر", value: d.comment });
    if (d.completed === true) items.push({ label: "وضعیت", value: "تکمیل نهایی" });
    if (typeof d.stepType === "string" && stepTypeLabelMap[d.stepType]) {
      items.push({ label: "نوع گام", value: stepTypeLabelMap[d.stepType] });
    }
    if (d.budgetLine) {
      const bl = d.budgetLine as { code?: string; title?: string };
      if (bl.code || bl.title) items.push({ label: "ردیف بودجه", value: `${bl.code || ""} ${bl.title || ""}`.trim() });
    }
  } else if (action === "finalized") {
    if (typeof d.comment === "string" && d.comment) items.push({ label: "نظر", value: d.comment });
    if (d.budgetLine) {
      const bl = d.budgetLine as { code?: string; title?: string };
      if (bl.code || bl.title) items.push({ label: "ردیف بودجه", value: `${bl.code || ""} ${bl.title || ""}`.trim() });
    }
  } else if (action === "goods_received" || action === "Receive") {
    if (isObjectId(d.goodsReceiptId)) items.push({ label: "رسید", ref: { model: "goodsReceipt", id: d.goodsReceiptId } });
    if (typeof d.itemCount === "number") items.push({ label: "تعداد اقلام", value: faNum(d.itemCount) });
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
    if (typeof d.quantity === "number") items.push({ label: "مقدار", value: faNum(d.quantity) });
    if (isObjectId(d.receivingUnitId)) items.push({ label: "واحد دریافت", ref: { model: "unit", id: d.receivingUnitId } });
    else if (entry.unit?.name) items.push({ label: "واحد دریافت", value: entry.unit.name });
  } else if (action === "goods_consumed" || action === "Consumed") {
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
    if (typeof d.quantity === "number") items.push({ label: "مقدار", value: faNum(d.quantity) });
    if (isObjectId(d.consumptionId)) items.push({ label: "سند مصرف", ref: { model: "consumption", id: d.consumptionId } });
    else if (isObjectId(d.consumptionRecordId)) items.push({ label: "سند مصرف", ref: { model: "consumption", id: d.consumptionRecordId } });
  } else if (action === "assigned") {
    if (typeof d.storeName === "string" && d.storeName) items.push({ label: "فروشگاه", value: d.storeName });
    else if (isObjectId(d.storeId)) items.push({ label: "فروشگاه", ref: { model: "store", id: d.storeId } });
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
  } else if (action === "stuff_removed") {
    if (isObjectId(d.stuffId)) items.push({ label: "کالا", ref: { model: "stuff", id: d.stuffId } });
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
    if (typeof d.quantity === "number") items.push({ label: "تعداد", value: faNum(d.quantity) });
    if (isObjectId(d.storeId)) items.push({ label: "فروشگاه", ref: { model: "store", id: d.storeId } });
    else if (typeof d.storeName === "string" && d.storeName) items.push({ label: "فروشگاه", value: d.storeName });
  } else if (action === "stuff_status_updated") {
    if (isObjectId(d.stuffId)) items.push({ label: "کالا", ref: { model: "stuff", id: d.stuffId } });
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
    if (typeof d.stuffStatus === "string" && stuffStatusLabelMap[d.stuffStatus]) {
      items.push({ label: "وضعیت کالا", value: stuffStatusLabelMap[d.stuffStatus] });
    }
  } else if (action === "PaymentInitiated" || action === "payment_ordered") {
    if (typeof d.amount === "number") items.push({ label: "مبلغ", value: `${faNum(d.amount)} تومان` });
    if (isObjectId(d.paymentOrderId)) items.push({ label: "دستور پرداخت", ref: { model: "paymentOrder", id: d.paymentOrderId } });
  } else if (action === "tender_created") {
    if (isObjectId(d.tenderId)) items.push({ label: "مناقصه", ref: { model: "tender", id: d.tenderId } });
    if (typeof d.title === "string" && d.title) items.push({ label: "عنوان", value: d.title });
    if (typeof d.deadline === "string" && d.deadline) {
      items.push({ label: "مهلت", value: new Date(d.deadline).toLocaleDateString("fa-IR") });
    }
  } else if (action === "tender_offer_selected") {
    if (typeof d.storeName === "string" && d.storeName) items.push({ label: "فروشگاه", value: d.storeName });
    if (typeof d.offerPrice === "number") items.push({ label: "قیمت", value: `${faNum(d.offerPrice)} ریال` });
    if (typeof d.estimatedAmount === "number") items.push({ label: "مبلغ", value: `${faNum(d.estimatedAmount)} ریال` });
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
    if (typeof d.quantity === "number") items.push({ label: "تعداد", value: faNum(d.quantity) });
    if (typeof d.tenderTitle === "string" && d.tenderTitle) items.push({ label: "مناقصه", value: d.tenderTitle });
    else if (isObjectId(d.tenderId)) items.push({ label: "مناقصه", ref: { model: "tender", id: d.tenderId } });
  } else if (action === "tender_awarded") {
    if (isObjectId(d.tenderId)) items.push({ label: "مناقصه", ref: { model: "tender", id: d.tenderId } });
    if (typeof d.offerPrice === "number") items.push({ label: "قیمت برنده", value: `${faNum(d.offerPrice)} ریال` });
    if (isObjectId(d.winningStoreId)) items.push({ label: "فروشگاه برنده", ref: { model: "store", id: d.winningStoreId } });
    else if (typeof d.storeName === "string" && d.storeName) items.push({ label: "فروشگاه", value: d.storeName });
    if (typeof d.wareModelName === "string" && d.wareModelName) items.push({ label: "کالا", value: d.wareModelName });
    if (typeof d.estimatedAmount === "number") items.push({ label: "مبلغ برآوردی", value: `${faNum(d.estimatedAmount)} ریال` });
  } else if (action === "tender_offer_removed") {
    if (isObjectId(d.previousTenderOfferId)) items.push({ label: "پیشنهاد قبلی", ref: { model: "tenderOffer", id: d.previousTenderOfferId } });
  }

  const knownKeys = new Set([
    "wareModelName", "quantity", "unitPrice", "storeId", "assignedFromId", "stepName", "comment",
    "itemCount", "storeName", "amount", "wareModelId", "goodsReceiptId", "consumptionRecordId",
    "tenderOfferId", "receivingUnitId", "stepIndex", "_id", "status", "currentStep", "completed",
    "tenderId", "title", "deadline", "offerPrice", "estimatedAmount", "tenderTitle",
    "previousTenderOfferId", "budgetLine", "stuffId", "previousStuffId", "consumptionId",
    "winningStoreId", "paymentOrderId", "stuffStatus", "unitId", "wareId", "processId",
    "pendingFinalization", "pricingMode", "finalWinner", "stepType", "offerDeliveryTime",
    "offerPaymentTerms", "performedBy",
  ]);

  for (const [key, val] of Object.entries(d)) {
    if (knownKeys.has(key)) continue;
    const idCfg = idFieldMap[key];
    if (idCfg && isObjectId(val)) {
      items.push({ label: idCfg.label, ref: { model: idCfg.model, id: val } });
      continue;
    }
    const enumCfg = enumFieldMap[key];
    if (enumCfg && typeof val === "string") {
      const mapped = enumCfg.map[val] ?? enumCfg.map[val.toLowerCase()];
      if (mapped) {
        items.push({ label: enumCfg.label, value: mapped });
        continue;
      }
    }
    const plainCfg = plainFieldMap[key];
    if (plainCfg) {
      if (plainCfg.format === "date" && typeof val === "string" && val) {
        items.push({ label: plainCfg.label, value: new Date(val).toLocaleDateString("fa-IR") });
      } else if (plainCfg.format === "number" && typeof val === "number") {
        items.push({ label: plainCfg.label, value: faNum(val) });
      } else if (typeof val === "string" && val.trim()) {
        items.push({ label: plainCfg.label, value: val.trim() });
      } else if (typeof val === "boolean") {
        items.push({ label: plainCfg.label, value: val ? "بله" : "خیر" });
      }
      continue;
    }
  }

  return items;
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-steel-border/20 bg-white/[0.02] p-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
          <History className="size-6 text-fog/40" />
        </div>
        <p className="text-body text-fog/50">تاریخچه‌ای ثبت نشده است</p>
      </div>
    );
  }

  const sorted = [...history]
    .filter((h) => h.performed?.at)
    .sort((a, b) => new Date(b.performed!.at!).getTime() - new Date(a.performed!.at!).getTime());

  const grouped = groupByDate(sorted);

  const allEntriesFlat = grouped.flatMap((g) => g.entries);
  let globalIdx = 0;

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="glass-card glass-card-hover-active rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
            <History className="size-5 text-electric-iris" />
          </div>
          <div>
            <h3 className="text-subheading font-medium text-glacier">تاریخچه رویدادها</h3>
            <p className="text-body-sm text-fog">{allEntriesFlat.length.toLocaleString("fa-IR")} رویداد</p>
          </div>
        </div>
        <span className="rounded-full bg-white/[0.03] px-2.5 py-1 text-caption text-fog ring-1 ring-inset ring-steel-border/25">
          جدیدترین اول
        </span>
      </div>

      <div className="relative mt-6">
        <div aria-hidden className="absolute start-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-frost-link/25 via-steel-border/25 to-transparent" />

        {grouped.map((group, groupIndex) => (
          <div key={group.dateKey} className={cn(groupIndex > 0 && "mt-6")}>
            <div className="relative z-[1] mb-3 ms-[44px]">
              <span className="inline-flex items-center rounded-full bg-graphite-plate px-3 py-1 text-caption font-medium text-pebble ring-1 ring-inset ring-steel-border/30">
                <Clock className="ms-0 me-1.5 size-4 text-fog" />
                {group.label}
              </span>
            </div>

            <div className="space-y-4">
              {group.entries.map((entry, entryIndex) => {
                const { icon: Icon, label, color } = getConfig(entry.action);
                const performer = entry.performed;
                const dt = performer?.at ? formatPersianDate(performer.at) : null;
                const thisGlobalIdx = globalIdx++;
                const isLatest = thisGlobalIdx === 0;
                const entryKey = `${group.dateKey}-${entryIndex}`;
                const details = computeDetailItems(entry);
                const isExpanded = expanded.has(entryKey);
                const roleLabelText = roleLabel(performer?.role?.name);
                const roleScopeText = scopeLabel(performer?.role?.scopeType);
                const hasRoleInfo = Boolean(roleLabelText || roleScopeText);

                return (
                  <div key={entryKey} className="relative flex items-start gap-4">
                    <div className="relative z-[1] shrink-0">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full ring-1 transition-all duration-300",
                          color,
                          isLatest && "shadow-[0_0_16px_rgba(182,217,252,0.25)]"
                        )}
                      >
                        <Icon className="size-5" strokeWidth={2} />
                      </div>
                      {isLatest && (
                        <span className="absolute -inset-1 animate-ping rounded-full bg-frost-link/10 pointer-events-none" aria-hidden />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-steel-border/20 bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <p className="text-body font-medium text-moonlight">{label}</p>
                        {dt && (
                          <span className="inline-flex items-center gap-1.5 text-caption text-fog" dir="ltr">
                            <Clock className="size-4 shrink-0 text-fog/60" />
                            {dt.time}
                          </span>
                        )}
                      </div>

                      {performer?.name && (
                        <div className="mt-3 flex items-center gap-2.5">
                          <Avatar size="sm" className="bg-graphite-plate ring-1 ring-inset ring-steel-border/30">
                            <AvatarFallback className="bg-transparent text-caption font-medium text-frost-link">
                              {initialsOf(performer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-body-sm font-medium text-pebble">{performer.name}</p>
                            {hasRoleInfo && (
                              <p className="truncate text-caption text-fog">
                                {roleLabelText}
                                {roleScopeText && ` — ${roleScopeText}`}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {details.length > 0 && (
                        <div className="mt-3 border-t border-steel-border/15 pt-3">
                          <button
                            type="button"
                            onClick={() => toggle(entryKey)}
                            aria-expanded={isExpanded}
                            className="inline-flex items-center gap-1.5 rounded-sm text-body-sm font-medium text-frost-link transition-colors hover:text-glacier focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} />
                            {isExpanded ? "بستن جزئیات" : "مشاهده جزئیات"}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 rounded-xl border border-steel-border/20 bg-midnight-ink/30 p-3">
                              {details.map((item, i) => (
                                <p key={i} className="flex items-start gap-1.5 text-body-sm leading-6 text-moonlight/75">
                                  <span className="mt-2.5 size-1 shrink-0 rounded-full bg-fog/40" aria-hidden />
                                  <span className="shrink-0 text-fog/70">{item.label}:</span>
                                  {item.ref ? (
                                    <EntityName model={item.ref.model} id={item.ref.id} />
                                  ) : (
                                    <span>{item.value}</span>
                                  )}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
