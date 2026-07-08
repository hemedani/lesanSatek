"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
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
import { remove } from "@/app/actions/ware/remove";
import { add } from "@/app/actions/ware/add";
import { update } from "@/app/actions/ware/update";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { gets as getWareClasses } from "@/app/actions/wareClass/gets";
import { gets as getWareGroups } from "@/app/actions/wareGroup/gets";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";
import { gets as getManufacturers } from "@/app/actions/manufacturer/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface WareType {
  _id: string;
  name?: string;
}

interface Ware {
  _id: string;
  name?: string;
  enName?: string;
  brand?: string;
  price?: number;
  orderedNumber?: number;
  createdAt?: string;
  wareType?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareGroup?: { _id: string; name?: string };
  wareModel?: { _id: string; name?: string };
  manufacturer?: { _id: string; name?: string };
}

interface WaresClientProps {
  items: Ware[];
  wareTypes: WareType[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
  selectedWareTypeId?: string;
}

const wareSchema = z.object({
  name: z.string().min(1, "نام کالا الزامی است"),
  enName: z.string().optional(),
  brand: z.string().optional(),
  price: z.string().optional(),
  orderedNumber: z.string().optional(),
  wareTypeId: z.string().min(1, "انتخاب نوع کالا الزامی است"),
  wareClassId: z.string().min(1, "انتخاب کلاس کالا الزامی است"),
  wareGroupId: z.string().min(1, "انتخاب گروه کالا الزامی است"),
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
  manufacturerId: z.string().optional(),
});

type WareData = z.input<typeof wareSchema>;

const wareTypeFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareTypes({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const wareClassFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareClasses({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const wareGroupFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareGroups({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const wareModelFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareModels({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const manufacturerFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getManufacturers({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

export function WaresClient({
  items,
  wareTypes,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
  selectedWareTypeId = "",
}: WaresClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Ware | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Ware | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<WareData>({
    resolver: zodV4Resolver(wareSchema),
    defaultValues: { name: "", enName: "", brand: "", price: "", orderedNumber: "", wareTypeId: "", wareClassId: "", wareGroupId: "", wareModelId: "", manufacturerId: "" },
  });

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (selectedWareTypeId) params.set("wareTypeId", selectedWareTypeId);
    router.push(`/admin/wares${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleWareTypeFilter = (typeId: string) => {
    const params = new URLSearchParams();
    if (typeId) params.set("wareTypeId", typeId);
    if (search) params.set("search", search);
    router.push(`/admin/wares${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const openAdd = () => {
    form.reset({ name: "", enName: "", brand: "", price: "", orderedNumber: "", wareTypeId: "", wareClassId: "", wareGroupId: "", wareModelId: "", manufacturerId: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: Ware) => {
    form.reset({
      name: item.name || "",
      enName: item.enName || "",
      brand: item.brand || "",
      price: item.price?.toString() ?? "",
      orderedNumber: item.orderedNumber?.toString() ?? "",
      wareTypeId: item.wareType?._id || "",
      wareClassId: item.wareClass?._id || "",
      wareGroupId: item.wareGroup?._id || "",
      wareModelId: item.wareModel?._id || "",
      manufacturerId: item.manufacturer?._id || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: WareData) => {
    const payload = {
      name: data.name,
      enName: data.enName || undefined,
      brand: data.brand || undefined,
      price: Number(data.price) || 0,
      orderedNumber: Number(data.orderedNumber) || 0,
    };

    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, ...payload },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("کالا با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی کالا");
      }
    } else {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          ...payload,
          wareTypeId: data.wareTypeId,
          wareClassId: data.wareClassId,
          wareGroupId: data.wareGroupId,
          wareModelId: data.wareModelId,
          manufacturerId: data.manufacturerId || undefined,
        },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("کالا با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد کالا");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("کالا با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف کالا");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filteredItems = useMemo(() => {
    if (!selectedWareTypeId) return items;
    return items.filter((item) => item.wareType?._id === selectedWareTypeId);
  }, [items, selectedWareTypeId]);

  const columns: Column<Ware>[] = [
    {
      key: "name",
      label: "نام کالا",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Package className="size-3.5 text-electric-iris" />
          </div>
          <div className="min-w-0">
            <span className="text-moonlight font-medium">{item.name || "—"}</span>
            {item.brand && (
              <span className="text-fog/60 text-xs me-2">({item.brand})</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "wareModel",
      label: "مدل",
      render: (item) => (
        <span className="text-fog text-sm">{item.wareModel?.name || "—"}</span>
      ),
    },
    {
      key: "manufacturer",
      label: "تولیدکننده",
      render: (item) => (
        <span className="text-fog text-sm">{item.manufacturer?.name || "—"}</span>
      ),
    },
    {
      key: "price",
      label: "قیمت",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.price != null ? item.price.toLocaleString("fa-IR") : "—"}
        </span>
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
        <PageHeader title="کالاها" description="مدیریت کالاها">
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            کالای جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی کالا...">
        <div className="flex items-center gap-2">
          <select
            value={selectedWareTypeId}
            onChange={(e) => handleWareTypeFilter(e.target.value)}
            className="h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            dir="rtl"
          >
            <option value="">همه انواع</option>
            {wareTypes.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item._id}
        cardView={cardView}
        onViewToggle={() => setCardView((v) => !v)}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer" onClick={() => openEdit(item)}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                  <Package className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">{item.name || "—"}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {item.wareModel?.name && <span className="text-xs text-fog/60">{item.wareModel.name}</span>}
                    {item.manufacturer?.name && <span className="text-xs text-fog/40">- {item.manufacturer.name}</span>}
                    {item.price != null && <span className="text-xs text-fog/40 font-mono" dir="ltr">{item.price.toLocaleString("fa-IR")} ریال</span>}
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
          </div>
        )}
        emptyTitle="کالایی یافت نشد"
        emptyDescription={selectedWareTypeId ? "برای این نوع کالا، کالایی ثبت نشده است." : "هنوز هیچ کالایی ثبت نشده است."}
        emptyAction={<Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" />ایجاد کالا</Button>}
      />

      {!selectedWareTypeId && <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">{editTarget ? "ویرایش کالا" : "کالای جدید"}</DialogTitle>
            <DialogDescription className="text-fog/70">{editTarget ? "اطلاعات کالا را ویرایش کنید" : "کالای جدید ایجاد کنید"}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormInput control={form.control} name="name" label="نام کالا" placeholder="مثال: مقاومت الکترونیکی" required disabled={form.formState.isSubmitting} />
                <FormInput control={form.control} name="enName" label="نام انگلیسی" placeholder="مثال: Electronic Resistor" disabled={form.formState.isSubmitting} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput control={form.control} name="brand" label="برند" placeholder="مثال: یاماها" disabled={form.formState.isSubmitting} />
                <FormInput control={form.control} name="price" label="قیمت (ریال)" type="number" placeholder="مثال: ۱۰۰۰۰۰" disabled={form.formState.isSubmitting} />
              </div>

              <FormInput control={form.control} name="orderedNumber" label="شماره سفارش" type="number" placeholder="مثال: ۱۰۰" disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="wareTypeId" label="نوع کالا" placeholder="نوع کالا را انتخاب کنید..." fetcher={wareTypeFetcher} required disabled={form.formState.isSubmitting} />
              <FormSearchSelect control={form.control} name="wareClassId" label="کلاس کالا" placeholder="کلاس کالا را انتخاب کنید..." fetcher={wareClassFetcher} required disabled={form.formState.isSubmitting} />
              <FormSearchSelect control={form.control} name="wareGroupId" label="گروه کالا" placeholder="گروه کالا را انتخاب کنید..." fetcher={wareGroupFetcher} required disabled={form.formState.isSubmitting} />
              <FormSearchSelect control={form.control} name="wareModelId" label="مدل کالا" placeholder="مدل کالا را انتخاب کنید..." fetcher={wareModelFetcher} required disabled={form.formState.isSubmitting} />
              <FormSearchSelect control={form.control} name="manufacturerId" label="تولیدکننده" placeholder="تولیدکننده را انتخاب کنید..." fetcher={manufacturerFetcher} disabled={form.formState.isSubmitting} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} disabled={form.formState.isSubmitting}>انصراف</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "در حال ذخیره..." : editTarget ? "ذخیره تغییرات" : "ایجاد کالا"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف کالا"
        description={`آیا از حذف کالا "${deleteTarget?.name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
