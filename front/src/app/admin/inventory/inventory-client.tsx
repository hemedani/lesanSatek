"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Warehouse, RotateCcw, ArrowRightLeft, Building2, Barcode, MapPin, CalendarDays, Factory, FolderTree, Box } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormSearchSelect, SearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { remove } from "@/app/actions/inventory/remove";
import { add } from "@/app/actions/inventory/add";
import { update } from "@/app/actions/inventory/update";
import { adjust } from "@/app/actions/inventory/adjust";
import { transferWithAudit } from "@/app/actions/inventory/transferWithAudit";
import { gets as getUnits } from "@/app/actions/unit/gets";
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
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
});

type InventoryData = z.infer<typeof inventorySchema>;

const unitFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWares({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1, wareModel: { _id: 1, name: 1 } });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string; wareModel?: { _id: string; name?: string } }) => ({
    _id: s._id,
    name: s.name || "",
    sublabel: s.wareModel?.name,
  }));
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
  const [transferTarget, setTransferTarget] = useState<Inventory | null>(null);
  const [toUnitId, setToUnitId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferring, setTransferring] = useState(false);

  const form = useForm<InventoryData>({
    resolver: zodV4Resolver(inventorySchema),
    defaultValues: { quantity: "", minQuantity: "", maxQuantity: "", batchNo: "", location: "", unitId: "", warehouseUnitId: "", wareId: "" },
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/inventory?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/inventory");
    }
  };

  const openAdd = () => {
    form.reset({ quantity: "", minQuantity: "", maxQuantity: "", batchNo: "", location: "", unitId: "", warehouseUnitId: "", wareId: "" });
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
        { activeRoleId: getActiveRoleIdFromStore(), quantity: Number(data.quantity), minQuantity: data.minQuantity ? Number(data.minQuantity) : undefined, maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : undefined, batchNo: data.batchNo || undefined, location: data.location || undefined, unitId: data.unitId, warehouseUnitId: data.warehouseUnitId || undefined, wareId: data.wareId },
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
      key: "ware",
      label: "کالا",
      render: (item) => {
        const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity;
        return (
          <div className="flex items-center gap-3 min-w-0 max-w-[280px]">
            <div className={cn(
              "size-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
              isLowStock ? "bg-ember/10" : "bg-electric-iris/10",
            )}>
              <Warehouse className={cn("size-4", isLowStock ? "text-ember" : "text-electric-iris")} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-moonlight truncate leading-5">
                  {item.ware?.name || item.wareModel?.name || "—"}
                </span>
                {isLowStock && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-ember/10 text-ember border-ember/20 shrink-0">
                    کم‌موجودی
                  </Badge>
                )}
              </div>
              {item.ware?.brand && (
                <p className="text-[10px] text-fog/40 truncate leading-4">{item.ware.brand}</p>
              )}
              {item.ware?.enName && item.ware.enName !== item.ware.name && (
                <p className="text-[10px] text-fog/30 truncate leading-4">{item.ware.enName}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "wareType",
      label: "دسته‌بندی",
      hideOnCard: true,
      render: (item) => (
        <div className="space-y-0.5">
          {item.wareType?.name && <p className="text-xs text-fog">{item.wareType.name}</p>}
          {item.wareClass?.name && <p className="text-[10px] text-fog/50">{item.wareClass.name}</p>}
          {!item.wareType?.name && !item.wareClass?.name && <span className="text-xs text-fog/40">—</span>}
        </div>
      ),
    },
    {
      key: "unit",
      label: "واحد مصرف‌کننده",
      render: (item) => (
        <div>
          <span className="text-xs text-fog">{item.unit?.name || "—"}</span>
          {item.unit?.type && <p className="text-[10px] text-fog/40">{item.unit.type}</p>}
        </div>
      ),
    },
    {
      key: "warehouseUnit",
      label: "انبار",
      render: (item) => (
        <span className="text-xs text-fog">{item.warehouseUnit?.name || "—"}</span>
      ),
    },
    {
      key: "quantity",
      label: "موجودی",
      render: (item) => {
        const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity;
        return (
          <div>
            <span className={cn(
              "text-sm font-semibold font-mono",
              isLowStock ? "text-ember" : "text-moonlight",
            )} dir="ltr">
              {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
            </span>
            {item.minQuantity != null && (
              <p className="text-[10px] text-fog/40" dir="ltr">
                حداقل: {item.minQuantity.toLocaleString("fa-IR")}
                {item.maxQuantity != null && ` · حداکثر: ${item.maxQuantity.toLocaleString("fa-IR")}`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "batchNo",
      label: "سریال",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog font-mono" dir="ltr">{item.batchNo || "—"}</span>
      ),
    },
    {
      key: "location",
      label: "موقعیت",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">{item.location || "—"}</span>
      ),
    },
    {
      key: "expirationDate",
      label: "تاریخ انقضا",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString("fa-IR") : "—"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ ثبت",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200 text-sky-400/60 hover:text-sky-400" onClick={() => { setAdjustTarget(item); setAdjustQuantity(""); setAdjustDescription(""); }}>
            <RotateCcw className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200 text-emerald-400/60 hover:text-emerald-400" onClick={() => { setTransferTarget(item); setToUnitId(""); setTransferQuantity(""); setTransferDescription(""); }}>
            <ArrowRightLeft className="size-3.5" />
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

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی کالا..." />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={cardView}
        onViewToggle={() => setCardView((v) => !v)}
        renderCard={(item) => {
          const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity;

          return (
            <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
              {/* Header with actions */}
              <div className={cn(
                "flex items-center gap-3 p-4 border-b",
                isLowStock ? "border-ember/10 bg-ember/[0.02]" : "border-white/[0.04]",
              )}>
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
                  isLowStock ? "bg-ember/10" : "bg-electric-iris/10",
                )}>
                  <Box className={cn("size-5", isLowStock ? "text-ember" : "text-electric-iris")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-moonlight truncate leading-5">
                      {item.ware?.name || item.wareModel?.name || "—"}
                    </p>
                    {isLowStock && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-ember/10 text-ember border-ember/20 shrink-0">
                        کم‌موجودی
                      </Badge>
                    )}
                  </div>
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
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon-xs" className="text-sky-400/60 hover:text-sky-400" onClick={(e) => { e.stopPropagation(); setAdjustTarget(item); setAdjustQuantity(""); setAdjustDescription(""); }}>
                    <RotateCcw className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" className="text-emerald-400/60 hover:text-emerald-400" onClick={(e) => { e.stopPropagation(); setTransferTarget(item); setToUnitId(""); setTransferQuantity(""); setTransferDescription(""); }}>
                    <ArrowRightLeft className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-moonlight" onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Quantity row */}
              <div className={cn(
                "grid grid-cols-3 gap-px bg-white/[0.04]",
                isLowStock && "bg-ember/[0.04]",
              )}>
                <div className={cn(
                  "p-3 text-center",
                  isLowStock ? "bg-ember/[0.02]" : "bg-[#05060f]/60",
                )}>
                  <p className="text-[10px] text-fog/50">موجودی</p>
                  <p className={cn(
                    "text-lg font-bold font-mono leading-7",
                    isLowStock ? "text-ember" : "text-glacier",
                  )} dir="ltr">
                    {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
                  </p>
                </div>
                <div className={cn(
                  "p-3 text-center",
                  isLowStock ? "bg-ember/[0.02]" : "bg-[#05060f]/60",
                )}>
                  <p className="text-[10px] text-fog/50">حداقل</p>
                  <p className="text-lg font-bold font-mono text-fog leading-7" dir="ltr">
                    {item.minQuantity != null ? item.minQuantity.toLocaleString("fa-IR") : "—"}
                  </p>
                </div>
                <div className={cn(
                  "p-3 text-center",
                  isLowStock ? "bg-ember/[0.02]" : "bg-[#05060f]/60",
                )}>
                  <p className="text-[10px] text-fog/50">حداکثر</p>
                  <p className="text-lg font-bold font-mono text-fog leading-7" dir="ltr">
                    {item.maxQuantity != null ? item.maxQuantity.toLocaleString("fa-IR") : "—"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">واحد مصرف‌کننده</p>
                      <p className="text-xs text-moonlight truncate">{item.unit?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Warehouse className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">انبار</p>
                      <p className="text-xs text-moonlight truncate">{item.warehouseUnit?.name || "—"}</p>
                    </div>
                  </div>
                  {item.batchNo && (
                    <div className="flex items-center gap-2">
                      <Barcode className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">سریال</p>
                        <p className="text-xs text-moonlight font-mono" dir="ltr">{item.batchNo}</p>
                      </div>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">موقعیت</p>
                        <p className="text-xs text-moonlight truncate">{item.location}</p>
                      </div>
                    </div>
                  )}
                  {item.expirationDate && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">تاریخ انقضا</p>
                        <p className="text-xs text-moonlight">{new Date(item.expirationDate).toLocaleDateString("fa-IR")}</p>
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
                </div>

                {/* Category badges */}
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
          );
        }}
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

      {/* Adjust Dialog */}
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

      {/* Transfer Dialog */}
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
                className="w-full h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="تعداد را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات انتقال</label>
              <textarea
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                className="w-full rounded-sm border border-steel-border/60 bg-transparent px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
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
                onClick={async () => {
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
                }}
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
        description={`آیا از حذف این موجودی انبار اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
