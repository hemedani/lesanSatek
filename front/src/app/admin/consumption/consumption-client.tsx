"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Plus, Trash2, User, Building2, MessageSquareText, CalendarDays, ClipboardList, FolderTree, Factory } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      label: "ثبت‌کننده",
      render: (item) => (
        <span className="text-xs text-fog">
          {item.consumedBy ? `${item.consumedBy.first_name || ""} ${item.consumedBy.last_name || ""}`.trim() || "—" : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "consumedFor",
      label: "مصرف‌شونده",
      render: (item) => (
        <span className="text-xs text-fog">{item.consumedFor || "—"}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "unit",
      label: "واحد",
      render: (item) => (
        <span className="text-xs text-fog">{item.unit?.name || "—"}</span>
      ),
      hideOnCard: true,
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
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog max-w-[200px] truncate">{item.notes || "—"}</span>
      ),
    },
    {
      key: "consumedAt",
      label: "تاریخ مصرف",
      render: (item) => (
        <span className="text-xs text-fog">{item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}</span>
      ),
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
          <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
            <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-inset ring-amber-500/15">
                <ScrollText className="size-5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-moonlight truncate leading-5">
                    {item.ware?.name || item.wareModel?.name || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.ware?.brand && (
                    <span className="text-[10px] text-fog/50 flex items-center gap-1">
                      <Factory className="size-3" />
                      {item.ware.brand}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-destructive shrink-0" onClick={() => setDeleteTarget(item)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
              <div className="p-3 text-center bg-[#05060f]/60">
                <p className="text-[10px] text-fog/50">مقدار</p>
                <p className="text-lg font-bold font-mono text-amber-400 leading-7" dir="ltr">
                  {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
                </p>
              </div>
              <div className="p-3 text-center bg-[#05060f]/60">
                <p className="text-[10px] text-fog/50">تاریخ مصرف</p>
                <p className="text-sm font-medium text-moonlight leading-7">
                  {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
                </p>
              </div>
              <div className="p-3 text-center bg-[#05060f]/60">
                <p className="text-[10px] text-fog/50">ثبت‌کننده</p>
                <p className="text-sm font-medium text-moonlight leading-7 truncate">
                  {item.consumedBy?.first_name || "—"}
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
