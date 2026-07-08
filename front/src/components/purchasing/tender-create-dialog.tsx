"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const [deadlineDate, setDeadlineDate] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !deadlineDate) return;
    setCreating(true);
    try {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          title: title.trim(),
          description: description.trim() || undefined,
          deadline: new Date(deadlineDate),
          purchasingRequestId,
          createdById: "",
        },
        { _id: 1, title: 1, status: 1 }
      );
      if (result.success) {
        toast.success("مناقصه با موفقیت ایجاد شد.");
        onOpenChange(false);
        setTitle("");
        setDescription("");
        setDeadlineDate("");
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در ایجاد مناقصه");
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
            <input
              type="datetime-local"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
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
