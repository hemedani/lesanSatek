"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Plus } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import { FormSearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { add } from "@/app/actions/consumption/add";
import { gets as getInventories } from "@/app/actions/inventory/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface ConsumptionRecord {
  _id: string;
  quantity?: number;
  notes?: string;
  reason?: string;
  consumedAt?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string };
  ware?: { _id: string; name?: string };
  wareModel?: { _id: string; name?: string };
  consumedBy?: { _id: string; first_name?: string };
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[];
}

const consumptionSchema = z.object({
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  quantity: z.string().min(1, "مقدار الزامی است"),
  reason: z.string().optional(),
  consumedFor: z.string().optional(),
  notes: z.string().optional(),
  consumedAt: z.string().min(1, "تاریخ الزامی است"),
  consumedAtTime: z.string().optional(),
});

type ConsumptionData = z.infer<typeof consumptionSchema>;

const inventoryFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getInventories({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, ware: { _id: 1, name: 1 }, quantity: 1 });
  if (!result.success) return [];
  const seen = new Set<string>();
  return result.body.reduce((acc: SearchSelectOption[], s: { _id: string; ware?: { _id: string; name?: string }; quantity?: number }) => {
    const wareId = s.ware?._id || s._id;
    if (seen.has(wareId)) return acc;
    seen.add(wareId);
    acc.push({
      _id: wareId,
      name: s.ware?.name || "نامشخص",
      sublabel: s.quantity != null ? `${s.quantity.toLocaleString("fa-IR")} عدد` : undefined,
    });
    return acc;
  }, []);
};

export function ConsumptionClient({ items }: ConsumptionClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ConsumptionData>({
    resolver: zodV4Resolver(consumptionSchema),
    defaultValues: { wareId: "", quantity: "", reason: "", consumedFor: "", notes: "", consumedAt: new Date().toISOString(), consumedAtTime: new Date().toTimeString().slice(0, 5) },
  });

  const onSubmit = async (data: ConsumptionData) => {
    setSubmitting(true);
    try {
      const [h, m] = (data.consumedAtTime || "00:00").split(":").map(Number)
      const consumedDate = new Date(data.consumedAt)
      consumedDate.setHours(h || 0, m || 0)
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          wareId: data.wareId,
          quantity: Number(data.quantity),
          reason: data.reason || undefined,
          consumedFor: data.consumedFor || undefined,
          notes: data.notes || undefined,
          consumedAt: consumedDate,
        },
        { _id: 1, quantity: 1 }
      );
      if (result.success) {
        toast.success("مصرف کالا با موفقیت ثبت شد");
        router.refresh();
        setShowDialog(false);
        form.reset();
      } else {
        toast.error(result.body?.message || "خطا در ثبت مصرف کالا");
      }
    } catch {
      toast.error("خطا در ثبت مصرف کالا");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<ConsumptionRecord>[] = [
    {
      key: "ware",
      label: "کالا",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <ScrollText className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-medium">{item.ware?.name || item.wareModel?.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "مقدار",
      render: (item) => (
        <span className="font-mono text-sm text-moonlight" dir="ltr">
          {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "consumedBy",
      label: "مصرف‌کننده",
      render: (item) => (
        <span className="text-fog text-sm">{item.consumedBy?.first_name || "—"}</span>
      ),
    },
    {
      key: "notes",
      label: "توضیحات",
      render: (item) => (
        <span className="text-fog text-sm max-w-[200px] truncate">{item.notes || "—"}</span>
      ),
    },
    {
      key: "consumedAt",
      label: "تاریخ مصرف",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "createdAt",
      label: "تاریخ ثبت",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => { form.reset(); setShowDialog(true); }}>
          <Plus className="size-4" />
          ثبت مصرف
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={cardView}
        onViewToggle={() => setCardView((v) => !v)}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                  <ScrollText className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">{item.ware?.name || item.wareModel?.name || "—"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-fog/60" dir="ltr">{item.quantity?.toLocaleString("fa-IR")} عدد</span>
                    {item.consumedBy?.first_name && (
                      <span className="text-xs text-fog/40">{item.consumedBy.first_name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {item.notes && (
              <p className="text-xs text-fog/50 mt-2">{item.notes}</p>
            )}
          </div>
        )}
        emptyTitle="مصرفی ثبت نشده"
        emptyDescription="هنوز هیچ مصرف کالایی ثبت نشده است."
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">ثبت مصرف کالا</DialogTitle>
            <DialogDescription className="text-fog/70">مصرف کالا از موجودی واحد را ثبت کنید</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="کالا را انتخاب کنید..." fetcher={inventoryFetcher} required disabled={submitting} />
              <FormInput control={form.control} name="quantity" label="مقدار مصرفی" type="number" placeholder="۰" required disabled={submitting} />

              <div className="grid grid-cols-2 gap-3">
                <FormJalaliDatePicker control={form.control} name="consumedAt" label="تاریخ مصرف" required disabled={submitting} />
                <FormInput control={form.control} name="consumedAtTime" label="ساعت" type="time" disabled={submitting} />
              </div>

              <FormInput control={form.control} name="reason" label="دلیل مصرف" placeholder="دلیل مصرف..." disabled={submitting} />
              <FormInput control={form.control} name="consumedFor" label="مصرف‌شونده" placeholder="نام شخص..." disabled={submitting} />
              <FormInput control={form.control} name="notes" label="توضیحات" placeholder="توضیحات..." disabled={submitting} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} disabled={submitting}>انصراف</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "در حال ثبت..." : "ثبت مصرف"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
