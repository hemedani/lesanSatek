"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Package, Gavel, Store, DollarSign, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SearchSelect } from "@/components/form/form-search-select";
import { finalize } from "@/app/actions/purchasingRequest/finalize";
import { gets as getBudgetLines } from "@/app/actions/budgetLine/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StoreInfo {
  _id: string;
  name?: string;
}

interface StuffInfo {
  _id: string;
  quantity?: number;
  price?: number;
  store?: StoreInfo;
}

interface OfferInfo {
  _id: string;
  price?: number;
  deliveryTime?: string;
  status?: string;
  store?: StoreInfo;
}

interface TenderInfo {
  _id: string;
  title?: string;
  offers?: OfferInfo[];
}

interface PRSummary {
  _id: string;
  title?: string;
  wareModel?: { name?: string };
  quantity?: number;
  estimatedAmount?: number;
  stuffStatus?: string;
  stuff?: StuffInfo;
  selectedTenderOfferId?: string;
  tenders?: TenderInfo[];
}

interface FinalizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pr: PRSummary | null;
  onSuccess?: () => void;
}

interface PostCompletionStepInput {
  name: string;
  unitId: string;
  description: string;
  comment: string;
}

export function FinalizeModal({ open, onOpenChange, pr, onSuccess }: FinalizeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [finalWinner, setFinalWinner] = useState<"stuff" | "tender" | null>(null);
  const [postSteps, setPostSteps] = useState<PostCompletionStepInput[]>([]);
  const [budgetLineId, setBudgetLineId] = useState("");

  if (!pr) return null;

  const hasStuff = pr.stuffStatus === "assigned" || pr.stuffStatus === "received";
  const winningOffer = pr.selectedTenderOfferId
    ? pr.tenders?.flatMap((t) => t.offers || []).find((o) => o._id === pr.selectedTenderOfferId)
    : undefined;
  const hasTender = !!winningOffer;
  const needsWinnerSelection = hasStuff && hasTender;

  const handleAddStep = () => {
    setPostSteps((prev) => [...prev, { name: "", unitId: "", description: "", comment: "" }]);
  };

  const handleRemoveStep = (index: number) => {
    setPostSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof PostCompletionStepInput, value: string) => {
    setPostSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleConfirm = async () => {
    if (needsWinnerSelection && !finalWinner) return;

    setLoading(true);
    try {
      const validSteps = postSteps.filter((s) => s.name.trim() && s.unitId.trim());
      const result = await finalize(
        {
          _id: pr._id,
          ...(needsWinnerSelection && finalWinner ? { finalWinner } : {}),
          ...(budgetLineId ? { budgetLineId } : {}),
          ...(validSteps.length > 0 ? { postCompletionSteps: validSteps } : {}),
        },
        { _id: 1, title: 1, status: 1, finalizedAt: 1, completedAt: 1 }
      );

      if (result.success) {
        toast.success("درخواست خرید با موفقیت نهایی‌سازی شد.");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/orghead/requests/${pr._id}`);
        }
      } else {
        toast.error(result.body?.message || "خطا در نهایی‌سازی درخواست خرید.");
      }
    } catch {
      toast.error("خطا در نهایی‌سازی درخواست خرید.");
    } finally {
      setLoading(false);
    }
  };

  const isConfirmDisabled = (needsWinnerSelection && !finalWinner) || loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تأیید نهایی درخواست خرید</DialogTitle>
          <DialogDescription>
            درخواست خرید پس از تأیید نهایی به وضعیت &laquo;تکمیل شده&raquo; تغییر وضعیت می‌دهد.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Summary */}
          <Card variant="glass">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium text-moonlight">{pr.title || "—"}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fog/60">
                {pr.wareModel?.name && <span>مدل کالا: {pr.wareModel.name}</span>}
                {pr.quantity != null && <span>تعداد: {pr.quantity.toLocaleString("fa-IR")}</span>}
                {pr.estimatedAmount != null && (
                  <span>{pr.estimatedAmount.toLocaleString("fa-IR")} ریال</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Winner Selection */}
          {needsWinnerSelection ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-moonlight">انتخاب برنده</p>
              <p className="text-xs text-fog/50">
                برای این درخواست هم کالا تخصیص داده شده و هم پیشنهاد مناقصه انتخاب شده است. لطفاً یکی را به عنوان برنده نهایی انتخاب کنید.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stuff option */}
                <div
                  className={cn(
                    "relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200",
                    finalWinner === "stuff"
                      ? "border-electric-iris bg-electric-iris/[0.04]"
                      : "border-steel-border/20 bg-white/[0.02] hover:border-frost-link/30"
                  )}
                  onClick={() => setFinalWinner("stuff")}
                >
                  {finalWinner === "stuff" && (
                    <div className="absolute -top-2 -end-2 size-5 rounded-full bg-electric-iris flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">✓</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-7 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <Package className="size-3.5 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-moonlight">تخصیص کالا</span>
                  </div>
                  <div className="space-y-1 text-xs text-fog/60">
                    {pr.stuff?.store?.name && (
                      <div className="flex items-center gap-1.5">
                        <Store className="size-3 text-fog/40" />
                        {pr.stuff.store.name}
                      </div>
                    )}
                    {pr.stuff?.price != null && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="size-3 text-fog/40" />
                        {pr.stuff.price.toLocaleString("fa-IR")} ریال
                      </div>
                    )}
                    {pr.stuff?.quantity != null && (
                      <div className="flex items-center gap-1.5">
                        <Package className="size-3 text-fog/40" />
                        تعداد: {pr.stuff.quantity.toLocaleString("fa-IR")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tender option */}
                <div
                  className={cn(
                    "relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200",
                    finalWinner === "tender"
                      ? "border-electric-iris bg-electric-iris/[0.04]"
                      : "border-steel-border/20 bg-white/[0.02] hover:border-frost-link/30"
                  )}
                  onClick={() => setFinalWinner("tender")}
                >
                  {finalWinner === "tender" && (
                    <div className="absolute -top-2 -end-2 size-5 rounded-full bg-electric-iris flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">✓</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-7 rounded-md bg-violet-500/10 flex items-center justify-center">
                      <Gavel className="size-3.5 text-violet-400" />
                    </div>
                    <span className="text-sm font-medium text-moonlight">مناقصه</span>
                  </div>
                  <div className="space-y-1 text-xs text-fog/60">
                    {winningOffer?.store?.name && (
                      <div className="flex items-center gap-1.5">
                        <Store className="size-3 text-fog/40" />
                        {winningOffer.store.name}
                      </div>
                    )}
                    {winningOffer?.price != null && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="size-3 text-fog/40" />
                        {winningOffer.price.toLocaleString("fa-IR")} ریال
                      </div>
                    )}
                    {winningOffer?.deliveryTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-fog/40" />
                        زمان تحویل: {winningOffer.deliveryTime}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : hasStuff ? (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.03] p-3">
              <div className="flex items-center gap-2 text-sm">
                <Package className="size-4 text-blue-400" />
                <span className="text-moonlight">برنده: تخصیص کالا</span>
              </div>
              <p className="text-xs text-fog/50 mt-1">
                تنها کالا تخصیص داده شده است، بنابراین به عنوان برنده نهایی انتخاب می‌شود.
              </p>
            </div>
          ) : hasTender ? (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.03] p-3">
              <div className="flex items-center gap-2 text-sm">
                <Gavel className="size-4 text-violet-400" />
                <span className="text-moonlight">برنده: پیشنهاد مناقصه</span>
              </div>
              <p className="text-xs text-fog/50 mt-1">
                تنها پیشنهاد مناقصه انتخاب شده است، بنابراین به عنوان برنده نهایی انتخاب می‌شود.
              </p>
            </div>
          ) : null}

          {/* Budget Line Override */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-moonlight">ردیف بودجه (اختیاری)</p>
            <p className="text-xs text-fog/50">
              در صورت نیاز می‌توانید ردیف بودجه متفاوتی را جایگزین کنید. بودجه جدید باید مانده کافی داشته باشد.
            </p>
            <SearchSelect
              value={budgetLineId}
              onChange={setBudgetLineId}
              label="ردیف بودجه"
              placeholder="جستجوی ردیف بودجه..."
              fetcher={async (search?: string) => {
                const result = await getBudgetLines(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, title: search || undefined } as any,
                  { _id: 1, code: 1, title: 1, remainingBudget: 1, totalAllocated: 1 }
                )
                if (!result.success || !result.body) return []
                return result.body.map((b: { _id?: string; code?: string; title?: string; remainingBudget?: number; totalAllocated?: number }) => ({
                  _id: b._id || "",
                  name: `${b.code || ""} ${b.title || ""}`.trim(),
                  sublabel: b.remainingBudget != null ? `${b.remainingBudget.toLocaleString("fa-IR")} ریال` : undefined,
                }))
              }}
            />
          </div>

          {/* Post-completion Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-moonlight">مراحل پس از تکمیل</p>
              <Button variant="outline" size="xs" onClick={handleAddStep} className="gap-1">
                <Plus className="size-3.5" />
                افزودن مرحله
              </Button>
            </div>
            <p className="text-xs text-fog/50">
              مراحل اضافی برای بررسی پس از تکمیل درخواست (اختیاری).
            </p>

            {postSteps.length === 0 && (
              <p className="text-xs text-fog/40 py-2 text-center">
                هنوز مرحله‌ای اضافه نشده است.
              </p>
            )}

            {postSteps.map((step, index) => (
              <div
                key={index}
                className="rounded-lg border border-steel-border/15 bg-white/[0.02] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-frost-link">مرحله {index + 1}</p>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemoveStep(index)}
                    className="text-ember/60 hover:text-ember"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-fog/60">نام مرحله</Label>
                    <Input
                      value={step.name}
                      onChange={(e) => handleStepChange(index, "name", e.target.value)}
                      placeholder="مثال: بررسی کارشناسی"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-fog/60">شناسه واحد</Label>
                    <Input
                      value={step.unitId}
                      onChange={(e) => handleStepChange(index, "unitId", e.target.value)}
                      placeholder="شناسه واحد مسئول"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-fog/60">توضیحات</Label>
                  <Textarea
                    value={step.description}
                    onChange={(e) => handleStepChange(index, "description", e.target.value)}
                    placeholder="توضیحات مرحله..."
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-fog/60">توضیح اضافه</Label>
                  <Textarea
                    value={step.comment}
                    onChange={(e) => handleStepChange(index, "comment", e.target.value)}
                    placeholder="توضیح از طرف رئیس سازمان..."
                    className="text-sm min-h-[60px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            انصراف
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirmDisabled} className="gap-1.5">
            {loading && <Loader2 className="size-4 animate-spin" />}
            تأیید نهایی
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
