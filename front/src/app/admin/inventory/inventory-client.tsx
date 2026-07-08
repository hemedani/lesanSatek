"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Warehouse, RotateCcw, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormSearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { remove } from "@/app/actions/inventory/remove";
import { add } from "@/app/actions/inventory/add";
import { update } from "@/app/actions/inventory/update";
import { adjust } from "@/app/actions/inventory/adjust";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";
import { gets as getWares } from "@/app/actions/ware/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface Inventory {
  _id: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  batchNo?: string;
  expirationDate?: string;
  location?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string };
  warehouseUnit?: { _id: string; name?: string };
  wareModel?: { _id: string; name?: string };
  ware?: { _id: string; name?: string };
}

interface InventoryClientProps {
  items: Inventory[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const inventorySchema = z.object({
  quantity: z.string().min(1, "مقدار الزامی است"),
  minQuantity: z.string().optional(),
  maxQuantity: z.string().optional(),
  batchNo: z.string().optional(),
  location: z.string().optional(),
  unitId: z.string().min(1, "انتخاب واحد الزامی است"),
  warehouseUnitId: z.string().optional(),
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
  wareId: z.string().optional(),
});

type InventoryData = z.input<typeof inventorySchema>;

const unitFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const wareModelFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareModels({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWares({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

export function InventoryClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: InventoryClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Inventory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Inventory | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Inventory | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const form = useForm<InventoryData>({
    resolver: zodV4Resolver(inventorySchema),
    defaultValues: { quantity: "", minQuantity: "", maxQuantity: "", batchNo: "", location: "", unitId: "", warehouseUnitId: "", wareModelId: "", wareId: "" },
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/inventory?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/inventory");
    }
  };

  const openAdd = () => {
    form.reset({ quantity: "", minQuantity: "", maxQuantity: "", batchNo: "", location: "", unitId: "", warehouseUnitId: "", wareModelId: "", wareId: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: Inventory) => {
    form.reset({
      quantity: item.quantity?.toString() ?? "",
      minQuantity: item.minQuantity?.toString() ?? "",
      maxQuantity: item.maxQuantity?.toString() ?? "",
      batchNo: item.batchNo || "",
      location: item.location || "",
      unitId: item.unit?._id || "",
      warehouseUnitId: item.warehouseUnit?._id || "",
      wareModelId: item.wareModel?._id || "",
      wareId: item.ware?._id || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: InventoryData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, quantity: Number(data.quantity), minQuantity: data.minQuantity ? Number(data.minQuantity) : undefined, maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : undefined, batchNo: data.batchNo || undefined, location: data.location || undefined },
        { _id: 1, quantity: 1 }
      );
      if (result.success) {
        toast.success("موجودی انبار با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی موجودی انبار");
      }
    } else {
      const result = await add(
        { activeRoleId: getActiveRoleIdFromStore(), quantity: Number(data.quantity), minQuantity: data.minQuantity ? Number(data.minQuantity) : undefined, maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : undefined, batchNo: data.batchNo || undefined, location: data.location || undefined, unitId: data.unitId, warehouseUnitId: data.warehouseUnitId || undefined, wareModelId: data.wareModelId, wareId: data.wareId || undefined },
        { _id: 1, quantity: 1 }
      );
      if (result.success) {
        toast.success("موجودی انبار با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد موجودی انبار");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("موجودی انبار با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف موجودی انبار");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns: Column<Inventory>[] = [
    {
      key: "wareModel",
      label: "مدل کالا",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Warehouse className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-medium">{item.wareModel?.name || item.ware?.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "unit",
      label: "واحد",
      render: (item) => (
        <span className="text-fog text-sm">{item.unit?.name || "—"}</span>
      ),
    },
    {
      key: "quantity",
      label: "مقدار",
      render: (item) => (
        <span className="font-mono text-sm" dir="ltr">
          {item.quantity != null ? (
            <span className={item.minQuantity != null && item.quantity < item.minQuantity ? "text-destructive font-medium" : "text-moonlight"}>
              {item.quantity.toLocaleString("fa-IR")}
            </span>
          ) : "—"}
        </span>
      ),
    },
    {
      key: "batchNo",
      label: "شماره سریال",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">{item.batchNo || "—"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ ایجاد",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200 text-sky-400/60 hover:text-sky-400" onClick={() => { setAdjustTarget(item); setAdjustQuantity(""); setAdjustDescription(""); }}>
            <RotateCcw className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200" onClick={() => openEdit(item)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200 text-fog/60 hover:text-destructive" onClick={() => setDeleteTarget(item)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader title="موجودی انبار" description="مدیریت موجودی کالا در واحدها و انبارها">
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            موجودی جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی مدل کالا..." />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={cardView}
        onViewToggle={() => setCardView((v) => !v)}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer" onClick={() => openEdit(item)}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                  <Warehouse className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">{item.wareModel?.name || item.ware?.name || "—"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.unit?.name && <span className="text-xs text-fog/60">{item.unit.name}</span>}
                    {item.quantity != null && (
                      <span className={cn(
                        "text-xs font-mono",
                        item.minQuantity != null && item.quantity < item.minQuantity ? "text-destructive" : "text-fog/40"
                      )} dir="ltr">
                        {item.quantity.toLocaleString("fa-IR")} عدد
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-moonlight" onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            {(item.batchNo || item.location) && (
              <div className="flex items-center gap-3 mt-2 text-xs text-fog/40">
                {item.batchNo && <span dir="ltr">{item.batchNo}</span>}
                {item.location && <span>{item.location}</span>}
              </div>
            )}
          </div>
        )}
        emptyTitle="موجودی‌ای یافت نشد"
        emptyDescription="هنوز هیچ موجودی انباری ثبت نشده است."
        emptyAction={<Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" />ایجاد موجودی</Button>}
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">{editTarget ? "ویرایش موجودی انبار" : "موجودی انبار جدید"}</DialogTitle>
            <DialogDescription className="text-fog/70">{editTarget ? "اطلاعات موجودی انبار را ویرایش کنید" : "موجودی انبار جدید ایجاد کنید"}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormSearchSelect control={form.control} name="unitId" label="واحد" placeholder="واحد را انتخاب کنید..." fetcher={unitFetcher} required disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="warehouseUnitId" label="واحد انبار" placeholder="واحد انبار را انتخاب کنید..." fetcher={unitFetcher} disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="wareModelId" label="مدل کالا" placeholder="مدل کالا را انتخاب کنید..." fetcher={wareModelFetcher} required disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="کالا را انتخاب کنید..." fetcher={wareFetcher} disabled={form.formState.isSubmitting} />

              <div className="grid grid-cols-3 gap-3">
                <FormInput control={form.control} name="quantity" label="مقدار" type="number" placeholder="۰" required disabled={form.formState.isSubmitting} />
                <FormInput control={form.control} name="minQuantity" label="حداقل" type="number" placeholder="۰" disabled={form.formState.isSubmitting} />
                <FormInput control={form.control} name="maxQuantity" label="حداکثر" type="number" placeholder="۰" disabled={form.formState.isSubmitting} />
              </div>

              <FormInput control={form.control} name="batchNo" label="شماره سریال" placeholder="مثال: BATCH-001" disabled={form.formState.isSubmitting} />

              <FormInput control={form.control} name="location" label="موقعیت" placeholder="مثال: قفسه A، ردیف ۳" disabled={form.formState.isSubmitting} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} disabled={form.formState.isSubmitting}>انصراف</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "در حال ذخیره..." : editTarget ? "ذخیره تغییرات" : "ایجاد موجودی"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={!!adjustTarget} onOpenChange={(open) => { if (!open) setAdjustTarget(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">تعدیل موجودی</DialogTitle>
            <DialogDescription className="text-fog/70">
              {adjustTarget?.wareModel?.name || adjustTarget?.ware?.name || ""}
              {" — "}موجودی فعلی: {adjustTarget?.quantity != null ? adjustTarget.quantity.toLocaleString("fa-IR") : "۰"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">تعداد جدید</label>
              <input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                className="w-full h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="تعداد جدید را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات تعدیل</label>
              <textarea
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                className="w-full rounded-sm border border-steel-border/60 bg-transparent px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                rows={2}
                placeholder="دلیل تعدیل..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setAdjustTarget(null)} disabled={adjusting}>
                انصراف
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!adjustTarget || !adjustQuantity) return;
                  setAdjusting(true);
                  try {
                    const result = await adjust(
                      {
                        activeRoleId: getActiveRoleIdFromStore(),
                        _id: adjustTarget._id,
                        quantity: Number(adjustQuantity),
                        description: adjustDescription || undefined,
                      },
                      { _id: 1, quantity: 1 }
                    );
                    if (result.success) {
                      toast.success("موجودی با موفقیت تعدیل شد.");
                      setAdjustTarget(null);
                      router.refresh();
                    } else {
                      toast.error(result.body?.message || "خطا در تعدیل موجودی");
                    }
                  } catch {
                    toast.error("خطا در تعدیل موجودی");
                  } finally {
                    setAdjusting(false);
                  }
                }}
                disabled={adjusting || !adjustQuantity}
                className="gap-1.5"
              >
                {adjusting ? "در حال تعدیل..." : "تأیید تعدیل"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف موجودی انبار"
        description={`آیا از حذف این موجودی انبار اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
