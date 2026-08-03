"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Box, Pencil, Trash2, ArrowDownUp, RotateCcw, ArrowRightLeft, Building2, MapPin, CalendarDays, Factory, FolderTree, Warehouse, Barcode, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { FilterSelect } from "@/components/ui/filter-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormSearchSelect, SearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import type { FilterOption } from "@/components/ui/filter-select";
import { remove } from "@/app/actions/inventory/remove";
import { add } from "@/app/actions/inventory/add";
import { update } from "@/app/actions/inventory/update";
import { adjust } from "@/app/actions/inventory/adjust";
import { transferWithAudit } from "@/app/actions/inventory/transferWithAudit";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { gets as getWares } from "@/app/actions/ware/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export interface Inventory {
  _id: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  batchNo?: string;
  expirationDate?: string;
  location?: string;
  lastCountedAt?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string; type?: string };
  warehouseUnit?: { _id: string; name?: string; type?: string };
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  wareModel?: { _id: string; name?: string; enName?: string };
  wareGroup?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
}

interface InventoryClientProps {
  items: Inventory[];
  prevUrl: string;
  nextUrl: string;
  page: number;
  totalPages: number;
  total: number;
  search: string;
  sort: string;
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-asc", label: "کمترین موجودی" },
  { value: "quantity-desc", label: "بیشترین موجودی" },
];

const inventorySchema = z.object({
  quantity: z.coerce.number().min(0, "مقدار نمی‌تواند منفی باشد"),
  minQuantity: z.coerce.number().optional(),
  maxQuantity: z.coerce.number().optional(),
  batchNo: z.string().optional(),
  location: z.string().optional(),
  unitId: z.string().min(1, "انتخاب واحد الزامی است"),
  warehouseUnitId: z.string().optional(),
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
});

type InventoryData = z.infer<typeof inventorySchema>;

function faDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function faQty(value?: number): string {
  return value != null ? value.toLocaleString("fa-IR") : "—"
}

const unitFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1, type: 1 });
  if (!result.success || !result.body) return [];
  return (result.body as { _id: string; name?: string; type?: string }[]).map((s) => ({
    _id: s._id,
    name: s.name || "",
    sublabel: s.type,
  }));
};

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWares({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1, wareModel: { _id: 1, name: 1 } });
  if (!result.success || !result.body) return [];
  return (result.body as { _id: string; name?: string; wareModel?: { _id: string; name?: string } }[]).map((s) => ({
    _id: s._id,
    name: s.name || "",
    sublabel: s.wareModel?.name,
  }));
};

function InventoryCard({
  item,
  onEdit,
  onDelete,
  onAdjust,
  onTransfer,
}: {
  item: Inventory;
  onEdit: (item: Inventory) => void;
  onDelete: (item: Inventory) => void;
  onAdjust: (item: Inventory) => void;
  onTransfer: (item: Inventory) => void;
}) {
  const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity;
  const categoryName = item.wareType?.name || item.wareClass?.name || item.wareGroup?.name;

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
            isLowStock ? "bg-ember/10 ring-ember/20" : "bg-electric-iris/10 ring-electric-iris/15",
          )}>
            <Box className={cn("size-5", isLowStock ? "text-ember" : "text-electric-iris")} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-semibold text-moonlight" title={item.ware?.name || item.wareModel?.name}>
                {item.ware?.name || item.wareModel?.name || "—"}
              </p>
              {isLowStock && (
                <Badge variant="outline" className="shrink-0 bg-ember/10 text-ember border-ember/20 text-[10px]">
                  کم‌موجودی
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-fog/60">
              {item.ware?.brand && (
                <span className="inline-flex items-center gap-1">
                  <Factory className="size-4" />
                  {item.ware.brand}
                </span>
              )}
              {categoryName && (
                <span className="inline-flex items-center gap-1">
                  <FolderTree className="size-4" />
                  {categoryName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">موجودی</p>
          <p className={cn("mt-1 truncate text-sm font-bold leading-6 font-mono", isLowStock ? "text-ember" : "text-glacier")}>
            {faQty(item.quantity)}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">حداقل</p>
          <p className="mt-1 truncate text-sm font-medium leading-6 font-mono text-fog/80">{faQty(item.minQuantity)}</p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">حداکثر</p>
          <p className="mt-1 truncate text-sm font-medium leading-6 font-mono text-fog/80">{faQty(item.maxQuantity)}</p>
        </div>
      </div>

      <div className="space-y-2 text-body-sm text-fog/70">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Building2 className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.unit?.name || "—"}</span>
          </span>
          {item.warehouseUnit?.name && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Warehouse className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.warehouseUnit.name}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {item.batchNo && (
            <span className="inline-flex items-center gap-1.5">
              <Barcode className="size-4 shrink-0 text-fog/60" />
              <span className="font-mono" dir="ltr">{item.batchNo}</span>
            </span>
          )}
          {item.location && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.location}</span>
            </span>
          )}
        </div>
        {item.expirationDate && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0 text-fog/60" />
            {faDate(item.expirationDate)}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/60">
          <CalendarDays className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-9 text-frost-link/80 hover:text-frost-link"
            title="تعدیل موجودی"
            onClick={() => onAdjust(item)}
          >
            <RotateCcw className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-9 text-emerald-400/80 hover:text-emerald-400"
            title="انتقال موجودی"
            onClick={() => onTransfer(item)}
          >
            <ArrowRightLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-9 text-fog/60 hover:text-moonlight"
            title="ویرایش"
            onClick={() => onEdit(item)}
          >
            <Pencil className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-9 text-fog/60 hover:text-ember hover:bg-ember/5"
            title="حذف"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function InventoryClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
}: InventoryClientProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Inventory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Inventory | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Inventory | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Inventory | null>(null);
  const [toUnitId, setToUnitId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferring, setTransferring] = useState(false);

  const form = useForm<InventoryData>({
    resolver: zodV4Resolver(inventorySchema),
    defaultValues: { quantity: 0, minQuantity: undefined, maxQuantity: undefined, batchNo: "", location: "", unitId: "", warehouseUnitId: "", wareId: "" },
  });

  const makeParams = useCallback(
    (next: { search?: string; sort?: string }) => {
      const params = new URLSearchParams();
      const nextSearch = (next.search ?? search).trim();
      const nextSort = next.sort ?? sort;
      if (nextSearch) params.set("search", nextSearch);
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort);
      return params.toString();
    },
    [search, sort],
  );

  const go = useCallback((qs: string) => router.push(`/admin/inventory${qs ? `?${qs}` : ""}`), [router]);

  const handleSearch = (value: string) => go(makeParams({ search: value }));
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }));
  const handleReset = () => router.push("/admin/inventory");

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc"));

  const openAdd = () => {
    form.reset({ quantity: 0, minQuantity: undefined, maxQuantity: undefined, batchNo: "", location: "", unitId: "", warehouseUnitId: "", wareId: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: Inventory) => {
    form.reset({
      quantity: item.quantity ?? 0,
      minQuantity: item.minQuantity ?? undefined,
      maxQuantity: item.maxQuantity ?? undefined,
      batchNo: item.batchNo || "",
      location: item.location || "",
      unitId: item.unit?._id || "",
      warehouseUnitId: item.warehouseUnit?._id || "",
      wareId: item.ware?._id || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: InventoryData) => {
    try {
      const result = editTarget
        ? await update(
            { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, quantity: Number(data.quantity), minQuantity: data.minQuantity ? Number(data.minQuantity) : undefined, maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : undefined, batchNo: data.batchNo || undefined, location: data.location || undefined },
            { _id: 1, quantity: 1 }
          )
        : await add(
            { activeRoleId: getActiveRoleIdFromStore(), quantity: Number(data.quantity), minQuantity: data.minQuantity ? Number(data.minQuantity) : undefined, maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : undefined, batchNo: data.batchNo || undefined, location: data.location || undefined, unitId: data.unitId, warehouseUnitId: data.warehouseUnitId || undefined, wareId: data.wareId },
            { _id: 1, quantity: 1 }
          );
      if (result.success) {
        toast.success(editTarget ? "موجودی انبار با موفقیت به‌روزرسانی شد" : "موجودی انبار با موفقیت ایجاد شد");
        setShowDialog(false);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در ذخیره موجودی انبار");
      }
    } catch {
      toast.error("خطا در ذخیره موجودی انبار");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
      if (result.success) {
        toast.success("موجودی انبار با موفقیت حذف شد");
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در حذف موجودی انبار");
      }
    } catch {
      toast.error("خطا در حذف موجودی انبار");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleAdjust = async () => {
    if (!adjustTarget || !adjustQuantity) return;
    setAdjusting(true);
    try {
      const result = await adjust(
        { activeRoleId: getActiveRoleIdFromStore(), _id: adjustTarget._id, quantity: Number(adjustQuantity), description: adjustDescription || undefined },
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
  };

  const handleTransfer = async () => {
    if (!transferTarget || !toUnitId || !transferQuantity) return;
    setTransferring(true);
    try {
      const result = await transferWithAudit(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          fromUnitId: transferTarget.unit?._id || "",
          toUnitId,
          wareId: transferTarget.ware?._id || "",
          quantity: Number(transferQuantity),
          description: transferDescription || undefined,
        },
        { fromUnit: { _id: 1 }, toUnit: { _id: 1 }, quantity: 1 }
      );
      if (result.success) {
        toast.success("موجودی با موفقیت انتقال یافت.");
        setTransferTarget(null);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در انتقال موجودی");
      }
    } catch {
      toast.error("خطا در انتقال موجودی");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="موجودی انبار"
        description="مدیریت موجودی کالا در واحدها و انبارها"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} موجودی
        </span>
        <Button className="gap-2 px-5" onClick={openAdd}>
          <Plus className="size-5" />
          موجودی جدید
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی کالا یا مدل…"
          ariaLabel="جستجوی موجودی"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش موجودی"
            value={sort}
            onValueChange={handleSort}
            options={sortOptions}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-11 gap-2 rounded-sm px-4 text-body-sm text-moonlight"
            >
              <RotateCcw className="size-5" strokeWidth={2} />
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <InventoryCard
              key={item._id}
              item={item}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onAdjust={(it) => { setAdjustTarget(it); setAdjustQuantity(""); setAdjustDescription(""); }}
              onTransfer={(it) => { setTransferTarget(it); setToUnitId(""); setTransferQuantity(""); setTransferDescription(""); }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title={hasFilters ? "موجودی‌ای یافت نشد" : "هنوز موجودی انباری ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، موجودی موردنظر را پیدا کنید."
              : "برای ثبت موجودی کالا در واحد یا انبار، اولین موجودی را ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Button className="gap-2 px-5" onClick={openAdd}>
                <Plus className="size-5" />
                ایجاد موجودی
              </Button>
            )
          }
        />
      )}

      {(prevUrl || nextUrl) && (
        <Pagination
          prevUrl={prevUrl}
          nextUrl={nextUrl}
          page={page}
          totalPages={totalPages}
          className="border-t border-steel-border/15 pt-2"
        />
      )}

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

              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="کالا را انتخاب کنید..." fetcher={wareFetcher} required disabled={form.formState.isSubmitting} />

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

      <Dialog open={!!adjustTarget} onOpenChange={(open) => { if (!open) setAdjustTarget(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">تعدیل موجودی</DialogTitle>
            <DialogDescription className="text-fog/70">
              {adjustTarget?.ware?.name || adjustTarget?.wareModel?.name || ""}
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
                className="w-full h-10 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="تعداد جدید را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات تعدیل</label>
              <textarea
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                className="w-full rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
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
                onClick={handleAdjust}
                disabled={adjusting || !adjustQuantity}
                className="gap-1.5"
              >
                {adjusting ? "در حال تعدیل..." : "تأیید تعدیل"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transferTarget} onOpenChange={(open) => { if (!open) setTransferTarget(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">انتقال موجودی</DialogTitle>
            <DialogDescription className="text-fog/70">
              {transferTarget?.ware?.name || transferTarget?.wareModel?.name || ""}
              {" — "}موجودی فعلی: {transferTarget?.quantity != null ? transferTarget.quantity.toLocaleString("fa-IR") : "۰"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">واحد مقصد</label>
              <SearchSelect
                value={toUnitId}
                onChange={setToUnitId}
                fetcher={unitFetcher}
                placeholder="واحد مقصد را انتخاب کنید..."
                label="واحد مقصد"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">تعداد انتقال</label>
              <input
                type="number"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                className="w-full h-10 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="تعداد را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات انتقال</label>
              <textarea
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                className="w-full rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                rows={2}
                placeholder="دلیل انتقال..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setTransferTarget(null)} disabled={transferring}>
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleTransfer}
                disabled={transferring || !toUnitId || !transferQuantity}
                className="gap-1.5"
              >
                {transferring ? "در حال انتقال..." : "انتقال"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف موجودی انبار"
        description={`آیا از حذف موجودی «${deleteTarget?.ware?.name || deleteTarget?.wareModel?.name || "این کالا"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
