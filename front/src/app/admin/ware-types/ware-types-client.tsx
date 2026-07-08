"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
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
import { remove } from "@/app/actions/wareType/remove";
import { add } from "@/app/actions/wareType/add";
import { update } from "@/app/actions/wareType/update";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface WareType {
  _id: string;
  name?: string;
  enName?: string;
  createdAt?: string;
}

interface WareTypesClientProps {
  items: WareType[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const wareTypeSchema = z.object({
  name: z.string().min(1, "نام نوع کالا الزامی است"),
  enName: z.string().optional(),
});

type WareTypeData = z.input<typeof wareTypeSchema>;

export function WareTypesClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: WareTypesClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<WareType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<WareType | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<WareTypeData>({
    resolver: zodV4Resolver(wareTypeSchema),
    defaultValues: { name: "", enName: "" },
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/ware-types?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/ware-types");
    }
  };

  const openAdd = () => {
    form.reset({ name: "", enName: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: WareType) => {
    form.reset({
      name: item.name || "",
      enName: item.enName || "",
    });
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: WareTypeData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, ...data },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("نوع کالا با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی نوع کالا");
      }
    } else {
      const result = await add(
        { activeRoleId: getActiveRoleIdFromStore(), ...data },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("نوع کالا با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد نوع کالا");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("نوع کالا با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف نوع کالا");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns: Column<WareType>[] = [
    {
      key: "name",
      label: "نام نوع کالا",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <FolderTree className="size-3.5 text-electric-iris" />
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
          title="انواع کالا"
          description="مدیریت انواع کالا"
        >
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            نوع کالای جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی نوع کالا..."
      />

      <DataTable
        columns={columns}
        data={items}
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
                  <FolderTree className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.name || "—"}
                  </p>
                  {item.enName && (
                    <p className="text-sm text-fog/60 leading-5 truncate mt-0.5 font-mono" dir="ltr">
                      {item.enName}
                    </p>
                  )}
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
        emptyTitle="نوع کالایی یافت نشد"
        emptyDescription="هنوز هیچ نوع کالایی ثبت نشده است."
        emptyAction={
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            ایجاد نوع کالا
          </Button>
        }
      />

      <Pagination
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">
              {editTarget ? "ویرایش نوع کالا" : "نوع کالای جدید"}
            </DialogTitle>
            <DialogDescription className="text-fog/70">
              {editTarget ? "اطلاعات نوع کالا را ویرایش کنید" : "نوع کالای جدید ایجاد کنید"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                control={form.control}
                name="name"
                label="نام نوع کالا"
                placeholder="مثال: الکترونیکی"
                required
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                control={form.control}
                name="enName"
                label="نام انگلیسی"
                placeholder="مثال: Electronic"
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
                    : editTarget ? "ذخیره تغییرات" : "ایجاد نوع کالا"
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
        title="حذف نوع کالا"
        description={`آیا از حذف نوع کالا "${deleteTarget?.name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
