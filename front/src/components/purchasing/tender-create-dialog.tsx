"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/tender/add";

interface TenderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasingRequestId: string;
}

export function TenderCreateDialog({ open, onOpenChange, purchasingRequestId }: TenderCreateDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !deadlineDate) return;
    setCreating(true);
    try {
      const [h, m] = (deadlineTime || "23:59").split(":").map(Number)
      const deadline = new Date(deadlineDate)
      deadline.setHours(h || 23, m || 59, 0, 0)
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          title: title.trim(),
          description: description.trim() || undefined,
          deadline,
          purchasingRequestId,
        },
        { _id: 1, title: 1, status: 1 }
      );
      if (result.success) {
        toast.success("مناقصه با موفقیت ایجاد شد.");
        onOpenChange(false);
        setTitle("");
        setDescription("");
        setDeadlineDate(undefined);
        setDeadlineTime("23:59");
        router.refresh();
      } else {
        const msg = result.body?.message || "";
        if (msg.includes("already has an active tender")) {
          toast.error("این درخواست خرید مناقصه فعال دارد. ابتدا مناقصه قبلی را تعیین تکلیف کنید.");
        } else if (msg.includes("Can only create tender for a Draft")) {
          toast.error("تنها می‌توانید برای درخواست‌های پیش‌نویس یا فعال مناقصه ایجاد کنید");
        } else {
          toast.error(msg || "خطا در ایجاد مناقصه");
        }
      }
    } catch {
      toast.error("خطا در ایجاد مناقصه");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-glacier">ایجاد مناقصه جدید</DialogTitle>
          <DialogDescription className="text-fog/70">برای این درخواست خرید مناقصه ایجاد کنید</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-moonlight mb-1.5">عنوان مناقصه</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="عنوان مناقصه"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-steel-border/60 bg-transparent px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              rows={2}
              placeholder="توضیحات..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-moonlight mb-1.5">مهلت ارسال پیشنهاد</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <JalaliDatePicker date={deadlineDate} onSelect={setDeadlineDate} placeholder="تاریخ مهلت" />
              </div>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-[100px] h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={creating}>
              انصراف
            </Button>
            <Button type="button" onClick={handleCreate} disabled={creating || !title.trim() || !deadlineDate} className="gap-1.5">
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Gavel className="size-4" />}
              {creating ? "در حال ایجاد..." : "ایجاد مناقصه"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
