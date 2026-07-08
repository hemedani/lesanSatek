"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Box } from "lucide-react";
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
import { remove } from "@/app/actions/stuff/remove";
import { add } from "@/app/actions/stuff/add";
import { update } from "@/app/actions/stuff/update";
import { gets as getWares } from "@/app/actions/ware/gets";
import { gets as getStores } from "@/app/actions/store/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface Stuff {
  _id: string;
  inventoryNo?: string;
  price?: number;
  hasAbsolutePrice?: boolean;
  pricePercentage?: number;
  createdAt?: string;
  ware?: { _id: string; name?: string };
  store?: { _id: string; name?: string };
}

interface StuffClientProps {
  items: Stuff[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const stuffSchema = z.object({
  inventoryNo: z.string().min(1, "شماره موجودی الزامی است"),
  price: z.string().min(1, "قیمت الزامی است"),
  hasAbsolutePrice: z.boolean().optional(),
  pricePercentage: z.string().optional(),
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  storeId: z.string().min(1, "انتخاب فروشگاه الزامی است"),
});

type StuffData = z.input<typeof stuffSchema>;

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWares({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const storeFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getStores({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

export function StuffClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: StuffClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Stuff | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Stuff | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<StuffData>({
    resolver: zodV4Resolver(stuffSchema),
    defaultValues: { inventoryNo: "", price: "", hasAbsolutePrice: false, pricePercentage: "", wareId: "", storeId: "" },
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/stuff?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/stuff");
    }
  };

  const openAdd = () => {
    form.reset({ inventoryNo: "", price: "", hasAbsolutePrice: false, pricePercentage: "", wareId: "", storeId: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: Stuff) => {
    form.reset({
      inventoryNo: item.inventoryNo?.toString() ?? "",
      price: item.price?.toString() ?? "",
      hasAbsolutePrice: item.hasAbsolutePrice ?? false,
      pricePercentage: item.pricePercentage?.toString() ?? "",
      wareId: item.ware?._id || "",
      storeId: item.store?._id || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: StuffData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, inventoryNo: Number(data.inventoryNo) || 0, price: Number(data.price) || 0, hasAbsolutePrice: data.hasAbsolutePrice ?? false, pricePercentage: data.pricePercentage ? Number(data.pricePercentage) : undefined },
        { _id: 1, inventoryNo: 1 }
      );
      if (result.success) {
        toast.success("موجودی با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی موجودی");
      }
    } else {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          inventoryNo: Number(data.inventoryNo) || 0,
          price: Number(data.price) || 0,
          hasAbsolutePrice: data.hasAbsolutePrice ?? false,
          pricePercentage: data.pricePercentage ? Number(data.pricePercentage) : undefined,
          wareId: data.wareId,
          storeId: data.storeId,
          isBarcodeSet: false,
          isQrcSet: false,
          wareTypeId: "",
          wareClassId: "",
          wareGroupId: "",
          wareModelId: "",
        } as any,
        { _id: 1, inventoryNo: 1 }
      );
      if (result.success) {
        toast.success("موجودی با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد موجودی");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("موجودی با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف موجودی");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns: Column<Stuff>[] = [
    {
      key: "inventoryNo",
      label: "شماره موجودی",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Box className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-medium font-mono text-sm" dir="ltr">{item.inventoryNo || "—"}</span>
        </div>
      ),
    },
    {
      key: "ware",
      label: "کالا",
      render: (item) => (
        <span className="text-fog text-sm">{item.ware?.name || "—"}</span>
      ),
    },
    {
      key: "store",
      label: "فروشگاه",
      render: (item) => (
        <span className="text-fog text-sm">{item.store?.name || "—"}</span>
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
        <PageHeader title="موجودی فروشگاه‌ها" description="مدیریت موجودی کالا در فروشگاه‌ها">
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            موجودی جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی شماره موجودی..." />

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
                  <Box className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate font-mono" dir="ltr">{item.inventoryNo || "—"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.ware?.name && <span className="text-xs text-fog/60">{item.ware.name}</span>}
                    {item.store?.name && <span className="text-xs text-fog/40">- {item.store.name}</span>}
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
            {item.price != null && (
              <p className="text-xs text-fog/40 mt-2 font-mono" dir="ltr">{item.price.toLocaleString("fa-IR")} ریال</p>
            )}
          </div>
        )}
        emptyTitle="موجودی‌ای یافت نشد"
        emptyDescription="هنوز هیچ موجودی‌ای ثبت نشده است."
        emptyAction={<Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" />ایجاد موجودی</Button>}
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">{editTarget ? "ویرایش موجودی" : "موجودی جدید"}</DialogTitle>
            <DialogDescription className="text-fog/70">{editTarget ? "اطلاعات موجودی را ویرایش کنید" : "موجودی جدید ایجاد کنید"}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput control={form.control} name="inventoryNo" label="شماره موجودی" placeholder="مثال: INV-001" disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="کالا را انتخاب کنید..." fetcher={wareFetcher} required disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="storeId" label="فروشگاه" placeholder="فروشگاه را انتخاب کنید..." fetcher={storeFetcher} required disabled={form.formState.isSubmitting} />

              <FormInput control={form.control} name="price" label="قیمت (ریال)" type="number" placeholder="مثال: ۵۰۰۰۰۰" disabled={form.formState.isSubmitting} />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasAbsolutePrice"
                  {...form.register("hasAbsolutePrice")}
                  className="size-4 rounded border-steel-border/60 bg-transparent accent-electric-iris"
                  disabled={form.formState.isSubmitting}
                />
                <label htmlFor="hasAbsolutePrice" className="text-sm text-moonlight">قیمت مطلق</label>
              </div>

              <FormInput control={form.control} name="pricePercentage" label="درصد قیمت" type="number" placeholder="مثال: ۱۰" disabled={form.formState.isSubmitting} />

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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف موجودی"
        description={`آیا از حذف موجودی "${deleteTarget?.inventoryNo || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
