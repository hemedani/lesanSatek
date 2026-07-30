"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import { FormSearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/consumption/add";
import { remove } from "@/app/actions/consumption/remove";
import { gets as getInventories } from "@/app/actions/inventory/gets";
import { gets as getWares } from "@/app/actions/ware/gets";

interface ConsumptionRecord {
  _id: string;
  quantity?: number;
  consumedAt?: string;
  reason?: string;
  consumedFor?: string;
  notes?: string;
  unit?: { _id: string; name?: string };
  consumedBy?: { _id: string; first_name?: string; last_name?: string };
  ware?: { _id: string; name?: string };
  wareModel?: { _id: string; name?: string };
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
}

const recordSchema = z.object({
  quantity: z.string().min(1, "مقدار الزامی است"),
  reason: z.string().optional(),
  consumedFor: z.string().optional(),
  notes: z.string().optional(),
  consumedAt: z.string().min(1, "تاریخ الزامی است"),
  consumedAtTime: z.string().optional(),
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  inventoryId: z.string().optional(),
  unitId: z.string().optional(),
});

type RecordData = z.infer<typeof recordSchema>;

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const r = await getWares({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q }, { _id: 1, name: 1, wareModel: { _id: 1, name: 1 } });
  if (!r.success) return [];
  return (r.body || []).map((s: { _id?: string; name?: string; wareModel?: { _id: string; name?: string } }) => ({
    _id: s._id || "",
    name: s.name || "",
    sublabel: s.wareModel?.name,
  }));
};

const invFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const r = await getInventories({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q }, { _id: 1, ware: { _id: 1, name: 1 }, quantity: 1 });
  if (!r.success) return [];
  const seen = new Set<string>();
  return (r.body || []).reduce((acc: SearchSelectOption[], i: { _id: string; ware?: { _id: string; name?: string }; quantity?: number }) => {
    const wareId = i.ware?._id || i._id;
    if (seen.has(wareId)) return acc;
    seen.add(wareId);
    acc.push({ _id: wareId, name: i.ware?.name || "—", sublabel: i.quantity != null ? `${i.quantity} عدد` : undefined });
    return acc;
  }, []);
};

export function ConsumptionClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
}: ConsumptionClientProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConsumptionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<RecordData>({
    resolver: zodV4Resolver(recordSchema),
    defaultValues: { quantity: "", reason: "", consumedFor: "", notes: "", consumedAt: new Date().toISOString(), consumedAtTime: new Date().toTimeString().slice(0, 5), wareId: "", inventoryId: "", unitId: "" },
  });

  const onSubmit = async (values: RecordData) => {
    const [h, m] = (values.consumedAtTime || "00:00").split(":").map(Number)
    const consumedDate = new Date(values.consumedAt)
    consumedDate.setHours(h || 0, m || 0)
    const r = await add({
      activeRoleId: getActiveRoleIdFromStore(),
      quantity: Number(values.quantity),
      reason: values.reason || undefined,
      consumedFor: values.consumedFor || undefined,
      notes: values.notes || undefined,
      consumedAt: consumedDate,
      wareId: values.wareId,
      inventoryId: values.inventoryId || undefined,
      unitId: values.unitId || undefined,
    }, { _id: 1 });
    if (r.success) {
      toast.success("مصرف ثبت شد.");
      setShowDialog(false);
      router.refresh();
    } else {
      toast.error(r.body?.message || "خطا در ثبت مصرف");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ _id: deleteTarget._id });
    if (result.success) {
      toast.success("مصرف با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف مصرف");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns: Column<ConsumptionRecord>[] = [
    {
      key: "ware",
      label: "کالا",
      render: (item) => <span className="text-moonlight font-medium">{item.ware?.name || item.wareModel?.name || "—"}</span>,
    },
    {
      key: "quantity",
      label: "مقدار",
      render: (item) => <span className="text-moonlight font-medium font-mono" dir="ltr">{item.quantity?.toLocaleString("fa-IR") || "—"}</span>,
    },
    {
      key: "reason",
      label: "دلیل",
      render: (item) => <span className="text-fog text-sm">{item.reason || "—"}</span>,
    },
    {
      key: "consumedBy",
      label: "ثبت‌کننده",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.consumedBy ? `${item.consumedBy.first_name || ""} ${item.consumedBy.last_name || ""}`.trim() || "—" : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "unit",
      label: "واحد",
      render: (item) => <span className="text-fog text-sm">{item.unit?.name || "—"}</span>,
      hideOnCard: true,
    },
    {
      key: "consumedAt",
      label: "تاریخ",
      render: (item) => <span className="text-fog text-sm">{item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200 text-fog/60 hover:text-destructive" onClick={() => setDeleteTarget(item)}>
          <Trash2 className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader title="مصرف" description="ثبت و مشاهده مصرف کالا">
          <Button size="sm" className="gap-1.5" onClick={() => { form.reset(); setShowDialog(true); }}>
            <Plus className="size-4" />
            ثبت مصرف
          </Button>
        </PageHeader>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(i) => i._id}
        cardView={false}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                <ScrollText className="size-5 text-electric-iris" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-moonlight">{item.ware?.name || item.wareModel?.name || "—"}</p>
                <p className="text-sm text-fog">{item.quantity?.toLocaleString("fa-IR")} عدد</p>
              </div>
              <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-destructive shrink-0" onClick={() => setDeleteTarget(item)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {item.reason && <p className="text-xs text-fog/50 mt-2">{item.reason}</p>}
          </div>
        )}
        emptyTitle="مصرفی یافت نشد"
        emptyDescription="هیچ مصرفی ثبت نشده است."
        emptyAction={<Button size="sm" className="gap-1.5" onClick={() => { form.reset(); setShowDialog(true); }}><Plus className="size-4" /> ثبت مصرف</Button>}
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">ثبت مصرف</DialogTitle>
            <DialogDescription className="text-fog/70">مصرف کالا را ثبت کنید</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="جستجوی کالا..." fetcher={wareFetcher} required />

              <FormSearchSelect control={form.control} name="inventoryId" label="موجودی (اختیاری)" placeholder="جستجوی موجودی..." fetcher={invFetcher} />

              <div className="grid grid-cols-2 gap-3">
                <FormInput control={form.control} name="quantity" label="مقدار" type="number" required />
                <FormJalaliDatePicker control={form.control} name="consumedAt" label="تاریخ" required />
              </div>
              <FormInput control={form.control} name="consumedAtTime" label="ساعت" type="time" />

              <FormInput control={form.control} name="reason" label="دلیل مصرف" />
              <FormInput control={form.control} name="consumedFor" label="مصرف‌شونده (اختیاری)" placeholder="نام شخص..." />
              <FormInput control={form.control} name="notes" label="یادداشت" />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} disabled={form.formState.isSubmitting}>انصراف</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "در حال ثبت..." : "ثبت مصرف"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف مصرف"
        description="آیا از حذف این مصرف اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
