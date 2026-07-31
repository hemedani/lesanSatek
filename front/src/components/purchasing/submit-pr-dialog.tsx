"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Send, Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
              <Send className="size-5 text-electric-iris" />
            </div>
            <div className="min-w-0">
              <DialogTitle>ارسال درخواست خرید</DialogTitle>
              <DialogDescription className="mt-1.5">
                با ارسال این درخواست، فرآیند خرید آغاز می‌شود و وارد گردش کار تأیید خواهد شد.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-4">
            <p className="text-body font-medium text-moonlight">{title || "درخواست خرید"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              {quantity != null && (
                <span className="inline-flex items-center gap-1.5 text-body-sm text-fog">
                  <PackageCheck className="size-4 text-fog/60" />
                  تعداد: {quantity.toLocaleString("fa-IR")}
                </span>
              )}
              {wareModelName && (
                <span className="inline-flex items-center gap-1.5 text-body-sm text-fog">
                  کالا: {wareModelName}
                </span>
              )}
            </div>
          </div>

          <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-body-sm leading-6 text-amber-400/90">
            پس از ارسال، امکان ویرایش درخواست وجود نخواهد داشت.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            {submitting ? "در حال ارسال..." : "ارسال درخواست"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
