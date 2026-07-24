"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { submit } from "@/app/actions/purchasingRequest/submit";

interface SubmitPRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasingRequestId: string;
  title?: string;
  quantity?: number;
  wareModelName?: string;
}

export function SubmitPRDialog({ open, onOpenChange, purchasingRequestId, title, quantity, wareModelName }: SubmitPRDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submit(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: purchasingRequestId,
        },
        { _id: 1, title: 1, status: 1, process: { _id: 1, name: 1 } }
      );
      if (result.success) {
        toast.success("درخواست خرید با موفقیت ارسال شد.");
        onOpenChange(false);
        router.refresh();
      } else {
        const msg = result.body?.message || "خطا در ارسال درخواست";
        if (msg.includes("active role does not have an associated unit")) {
          toast.error("نقش فعال شما به هیچ واحدی متصل نیست.");
        } else if (msg.includes("Could not determine organization")) {
          toast.error("شما به هیچ سازمانی تعلق ندارید.");
        } else if (msg.includes("Only Draft purchasing requests can be submitted")) {
          toast.error("این درخواست قبلاً ارسال شده است.");
        } else if (msg.includes("can only submit purchase requests for your own unit")) {
          toast.error("شما فقط می‌توانید درخواست‌های واحد خود را ارسال کنید.");
        } else if (msg.includes("linked tender is")) {
          toast.error("این درخواست مناقصه فعال دارد. ابتدا مناقصه را تعیین تکلیف کنید.");
        } else if (msg.includes("Please assign stuff or select a tender offer")) {
          toast.error("لطفاً ابتدا کالا تخصیص دهید یا از طریق مناقصه پیشنهاد انتخاب کنید");
        } else if (msg.includes("Purchasing request not found")) {
          toast.error("درخواست خرید یافت نشد.");
        } else if (msg.includes("No active process found")) {
          toast.error("فرآیند خرید فعالی برای این واحد یافت نشد. با مدیر خود تماس بگیرید.");
        } else {
          toast.error(msg);
        }
      }
    } catch {
      toast.error("خطا در ارسال درخواست خرید");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-glacier">ارسال درخواست خرید</DialogTitle>
          <DialogDescription className="text-fog/70">
            با ارسال این درخواست، فرآیند خرید آغاز می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PR Summary */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-steel-border/20 space-y-2">
            <p className="text-sm font-medium text-moonlight truncate">{title || "—"}</p>
            <div className="flex items-center gap-4 text-xs text-fog/50">
              {quantity != null && <span>تعداد: {quantity.toLocaleString("fa-IR")}</span>}
              {wareModelName && <span>کالا: {wareModelName}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {submitting ? "در حال ارسال..." : "ارسال درخواست"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
