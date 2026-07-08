"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Store } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormSearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { remove } from "@/app/actions/store/remove";
import { add } from "@/app/actions/store/add";
import { update } from "@/app/actions/store/update";
import { gets as getCities } from "@/app/actions/city/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface Store {
  _id: string;
  name?: string;
  status?: string;
  score?: number;
  address?: string;
  createdAt?: string;
  city?: { _id: string; name?: string };
}

interface StoresClientProps {
  items: Store[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const storeSchema = z.object({
  name: z.string().min(1, "نام فروشگاه الزامی است"),
  address: z.string().optional(),
  cityId: z.string().optional(),
  score: z.string().optional(),
  status: z.string().optional(),
});

type StoreData = z.input<typeof storeSchema>;

const cityFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getCities(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  );
  if (!result.success) return [];
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }));
};

const statusOptions = [
  { value: "", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
  { value: "pending", label: "در انتظار تأیید" },
];

export function StoresClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: StoresClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Store | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<StoreData>({
    resolver: zodV4Resolver(storeSchema),
    defaultValues: { name: "", address: "", cityId: "", score: "", status: "" },
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/stores?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/stores");
    }
  };

  const openAdd = () => {
    form.reset({ name: "", address: "", cityId: "", score: "", status: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: Store) => {
    form.reset({
      name: item.name || "",
      address: item.address || "",
      cityId: item.city?._id || "",
      score: item.score?.toString() ?? "",
      status: item.status || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: StoreData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, name: data.name, address: data.address || undefined, score: Number(data.score) || 0, status: data.status || "active" },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("فروشگاه با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی فروشگاه");
      }
    } else {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          name: data.name,
          address: data.address || undefined,
          cityId: data.cityId || undefined,
          score: Number(data.score) || 0,
          status: data.status || "active",
          fastDelivery: false,
          isAvailableInHolidays: false,
          totalSoldAmount: 0,
          totalSoldNum: 0,
        },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("فروشگاه با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد فروشگاه");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("فروشگاه با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف فروشگاه");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "inactive": return <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">غیرفعال</Badge>;
      case "pending": return <Badge variant="outline" className="text-fog/70 border-steel-border/40">در انتظار</Badge>;
      default: return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">فعال</Badge>;
    }
  };

  const columns: Column<Store>[] = [
    {
      key: "name",
      label: "نام فروشگاه",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Store className="size-3.5 text-electric-iris" />
          </div>
          <div className="min-w-0">
            <span className="text-moonlight font-medium">{item.name || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      label: "شهر",
      render: (item) => (
        <span className="text-fog text-sm">{item.city?.name || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "وضعیت",
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: "score",
      label: "امتیاز",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.score != null ? item.score.toLocaleString("fa-IR") : "—"}
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
        <PageHeader title="انبارها" description="مدیریت فروشگاه‌ها و انبارها">
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            فروشگاه جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی فروشگاه..." />

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
                  <Store className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">{item.name || "—"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.city?.name && <span className="text-xs text-fog/60">{item.city.name}</span>}
                    {item.score != null && <span className="text-xs text-fog/40 font-mono" dir="ltr">{item.score} امتیاز</span>}
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
            <div className="flex items-center gap-2 mt-3">
              {getStatusBadge(item.status)}
            </div>
          </div>
        )}
        emptyTitle="فروشگاهی یافت نشد"
        emptyDescription="هنوز هیچ فروشگاهی ثبت نشده است."
        emptyAction={<Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" />ایجاد فروشگاه</Button>}
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">{editTarget ? "ویرایش فروشگاه" : "فروشگاه جدید"}</DialogTitle>
            <DialogDescription className="text-fog/70">{editTarget ? "اطلاعات فروشگاه را ویرایش کنید" : "فروشگاه جدید ایجاد کنید"}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput control={form.control} name="name" label="نام فروشگاه" placeholder="مثال: فروشگاه الکترونیک پارس" required disabled={form.formState.isSubmitting} />
              <FormInput control={form.control} name="address" label="آدرس" placeholder="آدرس فروشگاه" disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="cityId" label="شهر" placeholder="شهر را انتخاب کنید..." fetcher={cityFetcher} disabled={form.formState.isSubmitting} />

              <FormInput control={form.control} name="score" label="امتیاز" type="number" placeholder="مثال: ۱۰۰" disabled={form.formState.isSubmitting} />

              <div className="space-y-2">
                <label className="text-sm font-medium text-moonlight">وضعیت</label>
                <select
                  {...form.register("status")}
                  className="flex h-10 w-full rounded-sm border border-steel-border/60 bg-transparent px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                  dir="rtl"
                  disabled={form.formState.isSubmitting}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-graphite-plate">{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} disabled={form.formState.isSubmitting}>انصراف</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "در حال ذخیره..." : editTarget ? "ذخیره تغییرات" : "ایجاد فروشگاه"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف فروشگاه"
        description={`آیا از حذف فروشگاه "${deleteTarget?.name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
