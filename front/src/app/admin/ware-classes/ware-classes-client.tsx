"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
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
import { remove } from "@/app/actions/wareClass/remove";
import { add } from "@/app/actions/wareClass/add";
import { update } from "@/app/actions/wareClass/update";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface WareType {
  _id: string;
  name?: string;
}

interface WareClass {
  _id: string;
  name?: string;
  enName?: string;
  createdAt?: string;
  wareType?: { _id: string; name?: string };
}

interface WareClassesClientProps {
  items: WareClass[];
  wareTypes: WareType[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
  selectedWareTypeId?: string;
}

const wareClassSchema = z.object({
  name: z.string().min(1, "نام کلاس کالا الزامی است"),
  enName: z.string().optional(),
  wareTypeId: z.string().min(1, "انتخاب نوع کالا الزامی است"),
});

type WareClassData = z.input<typeof wareClassSchema>;

const wareTypeFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareTypes(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  );
  if (!result.success) return [];
  const items: WareType[] = result.body;
  return items.map((s) => ({ _id: s._id, name: s.name || "" }));
};

export function WareClassesClient({
  items,
  wareTypes,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
  selectedWareTypeId = "",
}: WareClassesClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<WareClass | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<WareClass | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<WareClassData>({
    resolver: zodV4Resolver(wareClassSchema),
    defaultValues: { name: "", enName: "", wareTypeId: "" },
  });

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (selectedWareTypeId) params.set("wareTypeId", selectedWareTypeId);
    router.push(`/admin/ware-classes${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleWareTypeFilter = (typeId: string) => {
    const params = new URLSearchParams();
    if (typeId) params.set("wareTypeId", typeId);
    if (search) params.set("search", search);
    router.push(`/admin/ware-classes${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const openAdd = () => {
    form.reset({ name: "", enName: "", wareTypeId: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: WareClass) => {
    form.reset({
      name: item.name || "",
      enName: item.enName || "",
      wareTypeId: item.wareType?._id || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: WareClassData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("کلاس کالا با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی کلاس کالا");
      }
    } else {
      const result = await add(
        { activeRoleId: getActiveRoleIdFromStore(), name: data.name, enName: data.enName || undefined, wareTypeId: data.wareTypeId },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("کلاس کالا با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد کلاس کالا");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("کلاس کالا با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف کلاس کالا");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filteredItems = useMemo(() => {
    if (!selectedWareTypeId) return items;
    return items.filter((item) => item.wareType?._id === selectedWareTypeId);
  }, [items, selectedWareTypeId]);

  const columns: Column<WareClass>[] = [
    {
      key: "name",
      label: "نام کلاس کالا",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Layers className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-medium">{item.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "enName",
      label: "نام انگلیسی",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.enName || "—"}
        </span>
      ),
    },
    {
      key: "wareType",
      label: "نوع کالا",
      render: (item) => (
        <span className="text-fog text-sm">{item.wareType?.name || "—"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ ایجاد",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("fa-IR")
            : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200"
            onClick={() => openEdit(item)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-60 group-hover/row:opacity-100 transition-opacity duration-200 text-fog/60 hover:text-destructive"
            onClick={() => setDeleteTarget(item)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="کلاس‌های کالا"
          description="مدیریت کلاس‌های کالا"
        >
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            کلاس کالای جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی کلاس کالا..."
      >
        <div className="flex items-center gap-2">
          <select
            value={selectedWareTypeId}
            onChange={(e) => handleWareTypeFilter(e.target.value)}
            className="h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            dir="rtl"
          >
            <option value="">همه انواع</option>
            {wareTypes.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
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
          <div
            className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer"
            onClick={() => openEdit(item)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                  <Layers className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.wareType?.name && (
                      <span className="text-xs text-fog/60">{item.wareType.name}</span>
                    )}
                    {item.enName && (
                      <span className="text-xs text-fog/40 font-mono" dir="ltr">
                        {item.enName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-fog/60 hover:text-moonlight"
                  onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-fog/60 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
        emptyTitle="کلاس کالایی یافت نشد"
        emptyDescription={
          selectedWareTypeId
            ? "برای این نوع کالا، کلاسی ثبت نشده است."
            : "هنوز هیچ کلاس کالایی ثبت نشده است."
        }
        emptyAction={
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            ایجاد کلاس کالا
          </Button>
        }
      />

      {!selectedWareTypeId && (
        <Pagination
          prevUrl={prevPageUrl}
          nextUrl={nextPageUrl}
          page={page}
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">
              {editTarget ? "ویرایش کلاس کالا" : "کلاس کالای جدید"}
            </DialogTitle>
            <DialogDescription className="text-fog/70">
              {editTarget ? "اطلاعات کلاس کالا را ویرایش کنید" : "کلاس کالای جدید ایجاد کنید"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                control={form.control}
                name="name"
                label="نام کلاس کالا"
                placeholder="مثال: قطعات الکترونیکی"
                required
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                control={form.control}
                name="enName"
                label="نام انگلیسی"
                placeholder="مثال: Electronic Parts"
                disabled={form.formState.isSubmitting}
              />

              <FormSearchSelect
                control={form.control}
                name="wareTypeId"
                label="نوع کالا"
                placeholder="نوع کالا را انتخاب کنید..."
                fetcher={wareTypeFetcher}
                required
                disabled={form.formState.isSubmitting}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDialog(false)}
                  disabled={form.formState.isSubmitting}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "در حال ذخیره..."
                    : editTarget ? "ذخیره تغییرات" : "ایجاد کلاس کالا"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف کلاس کالا"
        description={`آیا از حذف کلاس کالا "${deleteTarget?.name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
