"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Grid3X3 } from "lucide-react";
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
import { remove } from "@/app/actions/wareGroup/remove";
import { add } from "@/app/actions/wareGroup/add";
import { update } from "@/app/actions/wareGroup/update";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface WareType {
  _id: string;
  name?: string;
}

interface WareClass {
  _id: string;
  name?: string;
}

interface WareGroup {
  _id: string;
  name?: string;
  enName?: string;
  createdAt?: string;
  wareType?: { _id: string; name?: string };
  wareClasses?: WareClass[];
}

interface WareGroupsClientProps {
  items: WareGroup[];
  wareTypes: WareType[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
  selectedWareTypeId?: string;
}

const wareGroupSchema = z.object({
  name: z.string().min(1, "نام گروه کالا الزامی است"),
  enName: z.string().optional(),
  wareTypeId: z.string().min(1, "انتخاب نوع کالا الزامی است"),
});

type WareGroupData = z.input<typeof wareGroupSchema>;

const wareTypeFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareTypes(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  );
  if (!result.success) return [];
  const items: WareType[] = result.body;
  return items.map((s) => ({ _id: s._id, name: s.name || "" }));
};

export function WareGroupsClient({
  items,
  wareTypes,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
  selectedWareTypeId = "",
}: WareGroupsClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<WareGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<WareGroup | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<WareGroupData>({
    resolver: zodV4Resolver(wareGroupSchema),
    defaultValues: { name: "", enName: "", wareTypeId: "" },
  });

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (selectedWareTypeId) params.set("wareTypeId", selectedWareTypeId);
    router.push(`/admin/ware-groups${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleWareTypeFilter = (typeId: string) => {
    const params = new URLSearchParams();
    if (typeId) params.set("wareTypeId", typeId);
    if (search) params.set("search", search);
    router.push(`/admin/ware-groups${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const openAdd = () => {
    form.reset({ name: "", enName: "", wareTypeId: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: WareGroup) => {
    form.reset({
      name: item.name || "",
      enName: item.enName || "",
      wareTypeId: item.wareType?._id || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: WareGroupData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("گروه کالا با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی گروه کالا");
      }
    } else {
      const result = await add(
        { activeRoleId: getActiveRoleIdFromStore(), name: data.name, enName: data.enName || undefined, wareTypeId: data.wareTypeId },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("گروه کالا با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد گروه کالا");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("گروه کالا با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف گروه کالا");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filteredItems = useMemo(() => {
    if (!selectedWareTypeId) return items;
    return items.filter((item) => item.wareType?._id === selectedWareTypeId);
  }, [items, selectedWareTypeId]);

  const columns: Column<WareGroup>[] = [
    {
      key: "name",
      label: "نام گروه کالا",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Grid3X3 className="size-3.5 text-electric-iris" />
          </div>
          <div className="min-w-0">
            <span className="text-moonlight font-medium">{item.name || "—"}</span>
            {item.wareClasses && item.wareClasses.length > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.wareClasses.map((wc) => (
                  <Badge key={wc._id} variant="outline" className="text-[10px] h-5 px-1.5 text-fog/70 border-steel-border/40">
                    {wc.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
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
          title="گروه‌های کالا"
          description="مدیریت گروه‌های کالا"
        >
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            گروه کالای جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی گروه کالا..."
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
                  <Grid3X3 className="size-5 text-electric-iris" />
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
        emptyTitle="گروه کالایی یافت نشد"
        emptyDescription={
          selectedWareTypeId
            ? "برای این نوع کالا، گروهی ثبت نشده است."
            : "هنوز هیچ گروه کالایی ثبت نشده است."
        }
        emptyAction={
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            ایجاد گروه کالا
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
              {editTarget ? "ویرایش گروه کالا" : "گروه کالای جدید"}
            </DialogTitle>
            <DialogDescription className="text-fog/70">
              {editTarget ? "اطلاعات گروه کالا را ویرایش کنید" : "گروه کالای جدید ایجاد کنید"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                control={form.control}
                name="name"
                label="نام گروه کالا"
                placeholder="مثال: مقاومت‌های الکترونیکی"
                required
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                control={form.control}
                name="enName"
                label="نام انگلیسی"
                placeholder="مثال: Electronic Resistors"
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
                    : editTarget ? "ذخیره تغییرات" : "ایجاد گروه کالا"
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
        title="حذف گروه کالا"
        description={`آیا از حذف گروه کالا "${deleteTarget?.name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
