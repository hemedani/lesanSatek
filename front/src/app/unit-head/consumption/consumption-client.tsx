"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Plus, User, Building2, MessageSquareText, CalendarDays, ClipboardList, FolderTree, Factory } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  consumedFor?: string;
  consumedAt?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string; type?: string };
  consumedBy?: { _id: string; first_name?: string; last_name?: string };
  inventory?: { _id: string; quantity?: number };
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  wareModel?: { _id: string; name?: string; enName?: string };
  wareGroup?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
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
        <div className="flex items-center gap-3 min-w-0 max-w-[280px]">
          <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-inset ring-amber-500/15">
            <ScrollText className="size-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-moonlight truncate leading-5 block">
              {item.ware?.name || item.wareModel?.name || "—"}
            </span>
            {item.ware?.brand && (
              <p className="text-[10px] text-fog/40 truncate leading-4">{item.ware.brand}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "مقدار",
      render: (item) => (
        <span className="text-sm font-semibold font-mono text-moonlight" dir="ltr">
          {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "consumedBy",
      label: "مصرف‌کننده",
      render: (item) => (
        <span className="text-xs text-fog">{item.consumedBy?.first_name || "—"}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "consumedFor",
      label: "مصرف‌شونده",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">{item.consumedFor || "—"}</span>
      ),
    },
    {
      key: "reason",
      label: "دلیل",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog max-w-[150px] truncate">{item.reason || "—"}</span>
      ),
    },
    {
      key: "notes",
      label: "توضیحات",
      render: (item) => (
        <span className="text-xs text-fog max-w-[200px] truncate">{item.notes || "—"}</span>
      ),
    },
    {
      key: "consumedAt",
      label: "تاریخ مصرف",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">
          {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ ثبت",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
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
          <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
            <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-inset ring-amber-500/15">
                <ScrollText className="size-5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-moonlight truncate leading-5">
                  {item.ware?.name || item.wareModel?.name || "—"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.ware?.brand && (
                    <span className="text-[10px] text-fog/50 flex items-center gap-1">
                      <Factory className="size-3" />
                      {item.ware.brand}
                    </span>
                  )}
                  {item.wareModel?.name && (
                    <span className="text-[10px] text-fog/40">مدل: {item.wareModel.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
              <div className="p-3 text-center bg-[#05060f]/60">
                <p className="text-[10px] text-fog/50">مقدار مصرف</p>
                <p className="text-lg font-bold font-mono text-amber-400 leading-7" dir="ltr">
                  {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
                </p>
              </div>
              <div className="p-3 text-center bg-[#05060f]/60">
                <p className="text-[10px] text-fog/50">مصرف‌کننده</p>
                <p className="text-sm font-medium text-moonlight leading-7 truncate">
                  {item.consumedBy?.first_name || "—"}
                </p>
              </div>
              <div className="p-3 text-center bg-[#05060f]/60">
                <p className="text-[10px] text-fog/50">تاریخ مصرف</p>
                <p className="text-sm font-medium text-moonlight leading-7">
                  {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-fog/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-fog/40">واحد</p>
                    <p className="text-xs text-moonlight truncate">{item.unit?.name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-fog/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-fog/40">مصرف‌شونده</p>
                    <p className="text-xs text-moonlight truncate">{item.consumedFor || "—"}</p>
                  </div>
                </div>
                {item.reason && (
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">دلیل</p>
                      <p className="text-xs text-moonlight truncate">{item.reason}</p>
                    </div>
                  </div>
                )}
                {item.notes && (
                  <div className="flex items-center gap-2">
                    <ClipboardList className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">توضیحات</p>
                      <p className="text-xs text-moonlight truncate">{item.notes}</p>
                    </div>
                  </div>
                )}
                {item.createdAt && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">تاریخ ثبت</p>
                      <p className="text-xs text-moonlight">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</p>
                    </div>
                  </div>
                )}
                {item.inventory && (
                  <div className="flex items-center gap-2">
                    <ClipboardList className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">موجودی پس از مصرف</p>
                      <p className="text-xs text-moonlight font-mono" dir="ltr">
                        {item.inventory.quantity != null ? item.inventory.quantity.toLocaleString("fa-IR") : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(item.wareType?.name || item.wareClass?.name || item.wareGroup?.name) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-white/[0.04]">
                  <FolderTree className="size-3 text-fog/30" />
                  {item.wareType?.name && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                      {item.wareType.name}
                    </Badge>
                  )}
                  {item.wareClass?.name && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                      {item.wareClass.name}
                    </Badge>
                  )}
                  {item.wareGroup?.name && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                      {item.wareGroup.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>
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
