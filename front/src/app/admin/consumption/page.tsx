"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ScrollText, Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { gets } from "@/app/actions/consumptionRecord/gets";
import { add } from "@/app/actions/consumptionRecord/add";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";
import { gets as getInventories } from "@/app/actions/inventory/gets";
import { FormSearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";

interface ConsumptionRecord {
  _id: string;
  quantity?: number;
  consumedAt?: string;
  reason?: string;
  patientId?: string;
  notes?: string;
}

const recordSchema = z.object({
  quantity: z.string().min(1, "مقدار الزامی است"),
  reason: z.string().optional(),
  patientId: z.string().optional(),
  notes: z.string().optional(),
  consumedAt: z.string().min(1, "تاریخ الزامی است"),
  inventoryId: z.string().min(1, "انتخاب موجودی الزامی است"),
  wareModelId: z.string().optional(),
});

type RecordData = z.input<typeof recordSchema>;

const invFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const r = await getInventories({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q }, { _id: 1, wareModel: { _id: 1, name: 1 }, quantity: 1 });
  if (!r.success) return [];
  return (r.body || []).map((i: any) => ({ _id: i._id, name: i.wareModel?.name || "—", sublabel: i.quantity != null ? `${i.quantity} عدد` : undefined }));
};

export default function ConsumptionPage() {
  const [items, setItems] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 30;

  const form = useForm<RecordData>({
    resolver: zodV4Resolver(recordSchema),
    defaultValues: { quantity: "", reason: "", patientId: "", notes: "", consumedAt: new Date().toISOString().slice(0, 16), inventoryId: "", wareModelId: "" },
  });

  const fetchItems = async (p: number) => {
    setLoading(true);
    const r = await gets({ activeRoleId: getActiveRoleIdFromStore(), page: p, limit }, { _id: 1, quantity: 1, consumedAt: 1, reason: 1, patientId: 1, notes: 1 });
    if (r.success) setItems(r.body || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(page); }, [page]);

  const onSubmit = async (values: RecordData) => {
    const r = await add({
      activeRoleId: getActiveRoleIdFromStore(),
      quantity: Number(values.quantity),
      reason: values.reason || undefined,
      patientId: values.patientId || undefined,
      notes: values.notes || undefined,
      consumedAt: new Date(values.consumedAt),
      inventoryId: values.inventoryId,
      wareModelId: values.wareModelId || undefined,
    }, { _id: 1 });
    if (r.success) { toast.success("مصرف ثبت شد."); setShowDialog(false); fetchItems(page); }
    else toast.error(r.body?.message || "خطا");
  };

  const columns: Column<ConsumptionRecord>[] = [
    { key: "quantity", label: "مقدار", render: (item) => <span className="text-moonlight font-medium font-mono" dir="ltr">{item.quantity?.toLocaleString("fa-IR") || "—"}</span> },
    { key: "reason", label: "دلیل", render: (item) => <span className="text-fog text-sm">{item.reason || "—"}</span> },
    { key: "consumedAt", label: "تاریخ", render: (item) => <span className="text-fog text-sm">{item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}</span> },
    { key: "patientId", label: "بیمار", render: (item) => <span className="text-fog text-sm">{item.patientId || "—"}</span> },
  ];

  if (loading && page === 1) return <div className="space-y-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="مصرف" description="ثبت و مشاهده مصرف کالا"><Button size="sm" className="gap-1.5" onClick={() => { form.reset(); setShowDialog(true); }}><Plus className="size-4" /> ثبت مصرف</Button></PageHeader>
      <DataTable columns={columns} data={items} keyExtractor={(i) => i._id} cardView={false} renderCard={(item) => (<div className="glass-card glass-card-hover-active rounded-xl p-4"><ScrollText className="size-5 text-electric-iris" /><p className="font-semibold text-moonlight mt-2">{item.quantity?.toLocaleString("fa-IR")} عدد</p><p className="text-xs text-fog/50">{item.reason || "—"}</p></div>)} emptyTitle="مصرفی یافت نشد" emptyDescription="هیچ مصرفی ثبت نشده است." />
      <Pagination prevUrl={page > 1 ? "#" : ""} nextUrl={items.length >= limit ? "#" : ""} page={page} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-glacier">ثبت مصرف</DialogTitle><DialogDescription className="text-fog/70">مصرف کالا را ثبت کنید</DialogDescription></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormSearchSelect control={form.control} name="inventoryId" label="موجودی" placeholder="جستجوی موجودی..." fetcher={invFetcher} required />
            <div className="grid grid-cols-2 gap-3">
              <FormInput control={form.control} name="quantity" label="مقدار" type="number" required />
              <FormInput control={form.control} name="consumedAt" label="تاریخ" type="datetime-local" required />
            </div>
            <FormInput control={form.control} name="reason" label="دلیل مصرف" />
            <FormInput control={form.control} name="patientId" label="شناسه بیمار (اختیاری)" />
            <FormInput control={form.control} name="notes" label="یادداشت" />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>انصراف</Button>
              <Button type="submit">ثبت مصرف</Button>
            </div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
