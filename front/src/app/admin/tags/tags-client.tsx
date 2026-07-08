"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Tags, Palette } from "lucide-react";
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
import { FormTextarea } from "@/components/form/form-textarea";
import { remove } from "@/app/actions/tag/remove";
import { add } from "@/app/actions/tag/add";
import { update } from "@/app/actions/tag/update";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const onlyColumns: Column<Tag>[] = [
  {
    key: "name",
    label: "نام",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div
          className="size-6 rounded-lg flex items-center justify-center border border-white/10 shrink-0"
          style={{ backgroundColor: item.color || "#3b82f6" }}
        >
          <Palette className="size-3 text-white" />
        </div>
        <span className="text-moonlight font-medium">{item.name || "—"}</span>
      </div>
    ),
  },
  {
    key: "color",
    label: "رنگ",
    render: (item) => (
      <div className="flex items-center gap-2">
        <div
          className="size-5 rounded-full border border-white/10"
          style={{ backgroundColor: item.color || "#3b82f6" }}
        />
        <span className="text-fog text-sm font-mono">{item.color || "—"}</span>
      </div>
    ),
    hideOnCard: true,
  },
  {
    key: "description",
    label: "توضیحات",
    render: (item) => (
      <span className="text-fog text-sm truncate max-w-[200px] block">
        {item.description || "—"}
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
];

interface Tag {
  _id: string;
  name?: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt?: string;
}

interface TagsClientProps {
  items: Tag[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const tagSchema = z.object({
  name: z.string().min(1, "نام برچسب الزامی است"),
  color: z.string().optional(),
  description: z.string().optional(),
});

type TagData = z.input<typeof tagSchema>;

const TAG_COLORS = [
  { value: "#ef4444", label: "قرمز" },
  { value: "#f97316", label: "نارنجی" },
  { value: "#eab308", label: "زرد" },
  { value: "#22c55e", label: "سبز" },
  { value: "#06b6d4", label: "فیروزه‌ای" },
  { value: "#3b82f6", label: "آبی" },
  { value: "#8b5cf6", label: "بنفش" },
  { value: "#ec4899", label: "صورتی" },
  { value: "#78716c", label: "خاکستری" },
];

// columns are defined inside TagsClient for actions scope

export function TagsClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: TagsClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Tag | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<TagData>({
    resolver: zodV4Resolver(tagSchema),
    defaultValues: { name: "", color: "", description: "" },
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/tags?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/tags");
    }
  };

  const openAdd = () => {
    form.reset({ name: "", color: "", description: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (tag: Tag) => {
    form.reset({
      name: tag.name || "",
      color: tag.color || "",
      description: tag.description || "",
    });
    setEditTarget(tag);
    setShowDialog(true);
  };

  const onSubmit = async (data: TagData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, ...data },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("برچسب با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی برچسب");
      }
    } else {
      const result = await add(
        { activeRoleId: getActiveRoleIdFromStore(), ...data },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("برچسب با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد برچسب");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("برچسب با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف برچسب");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns: Column<Tag>[] = [
    ...onlyColumns,
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
          title="برچسب‌ها"
          description="مدیریت برچسب‌ها و دسته‌بندی‌ها"
        >
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            برچسب جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی برچسب..."
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
                <div
                  className="size-10 rounded-xl flex items-center justify-center border border-white/10 shrink-0"
                  style={{ backgroundColor: item.color || "#3b82f6" }}
                >
                  <Tags className="size-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.name || "—"}
                  </p>
                  {item.description && (
                    <p className="text-sm text-fog/60 leading-5 truncate mt-0.5">
                      {item.description}
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
        emptyTitle="برچسبی یافت نشد"
        emptyDescription="هنوز هیچ برچسبی ایجاد نشده است."
        emptyAction={
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            ایجاد برچسب
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
              {editTarget ? "ویرایش برچسب" : "برچسب جدید"}
            </DialogTitle>
            <DialogDescription className="text-fog/70">
              {editTarget ? "اطلاعات برچسب را ویرایش کنید" : "برچسب جدید ایجاد کنید"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                control={form.control}
                name="name"
                label="نام برچسب"
                placeholder="مثال: فوری"
                required
                disabled={form.formState.isSubmitting}
              />

              <div className="space-y-2">
                <label className="text-xs text-fog/70 block font-medium">رنگ</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => form.setValue("color", c.value)}
                      className="size-8 rounded-full transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                  {form.watch("color") && (
                    <button
                      type="button"
                      onClick={() => form.setValue("color", "")}
                      className="size-8 rounded-full bg-white/[0.05] border border-steel-border/30 flex items-center justify-center text-[10px] text-fog/60 hover:text-moonlight transition-colors"
                      title="حذف رنگ"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {form.watch("color") && (
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="size-4 rounded border border-white/10"
                      style={{ backgroundColor: form.watch("color") || undefined }}
                    />
                    <span className="text-xs text-fog/50 font-mono">{form.watch("color")}</span>
                  </div>
                )}
              </div>

              <FormTextarea
                control={form.control}
                name="description"
                label="توضیحات"
                placeholder="توضیحات مختصری درباره برچسب..."
                rows={2}
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
                    : editTarget ? "ذخیره تغییرات" : "ایجاد برچسب"
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
        title="حذف برچسب"
        description={`آیا از حذف برچسب "${deleteTarget?.name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
