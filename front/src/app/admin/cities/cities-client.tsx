"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
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
import { remove } from "@/app/actions/city/remove";
import { add } from "@/app/actions/city/add";
import { update } from "@/app/actions/city/update";
import { gets as getStates } from "@/app/actions/state/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface City {
  _id: string;
  name?: string;
  enName?: string;
  createdAt?: string;
  state?: { _id: string; name?: string };
}

interface State {
  _id: string;
  name?: string;
}

interface CitiesClientProps {
  items: City[];
  states: State[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
  selectedStateId?: string;
}

const citySchema = z.object({
  name: z.string().min(1, "نام شهر الزامی است"),
  enName: z.string().optional(),
  stateId: z.string().min(1, "انتخاب استان الزامی است"),
});

type CityData = z.input<typeof citySchema>;

const stateFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getStates(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  );
  if (!result.success) return [];
  const items: State[] = result.body;
  return items.map((s) => ({ _id: s._id, name: s.name || "" }));
};

export function CitiesClient({
  items,
  states,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
  selectedStateId = "",
}: CitiesClientProps) {
  const router = useRouter();
  const [cardView, setCardView] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<City | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<CityData>({
    resolver: zodV4Resolver(citySchema),
    defaultValues: { name: "", enName: "", stateId: "" },
  });

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (selectedStateId) params.set("stateId", selectedStateId);
    router.push(`/admin/cities${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleStateFilter = (stateId: string) => {
    const params = new URLSearchParams();
    if (stateId) params.set("stateId", stateId);
    if (search) params.set("search", search);
    router.push(`/admin/cities${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const openAdd = () => {
    form.reset({ name: "", enName: "", stateId: "" });
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (city: City) => {
    form.reset({
      name: city.name || "",
      enName: city.enName || "",
      stateId: city.state?._id || "",
    });
    setEditTarget(city);
    setShowDialog(true);
  };

  const onSubmit = async (data: CityData) => {
    if (editTarget) {
      const result = await update(
        { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("شهر با موفقیت به‌روزرسانی شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی شهر");
      }
    } else {
      const result = await add(
        { activeRoleId: getActiveRoleIdFromStore(), name: data.name, enName: data.enName || undefined, stateId: data.stateId },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("شهر با موفقیت ایجاد شد");
        router.refresh();
        setShowDialog(false);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد شهر");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("شهر با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف شهر");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filteredItems = useMemo(() => {
    if (!selectedStateId) return items;
    return items.filter((city) => city.state?._id === selectedStateId);
  }, [items, selectedStateId]);

  const columns: Column<City>[] = [
    {
      key: "name",
      label: "نام شهر",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <MapPin className="size-3.5 text-electric-iris" />
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
      key: "state",
      label: "استان",
      render: (item) => (
        <span className="text-fog text-sm">{item.state?.name || "—"}</span>
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
          title="شهرها"
          description="مدیریت شهرهای کشور"
        >
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            شهر جدید
          </Button>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی شهر..."
      >
        <div className="flex items-center gap-2">
          <select
            value={selectedStateId}
            onChange={(e) => handleStateFilter(e.target.value)}
            className="h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            dir="rtl"
          >
            <option value="">همه استان‌ها</option>
            {states.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
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
                  <MapPin className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.state?.name && (
                      <span className="text-xs text-fog/60">{item.state.name}</span>
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
        emptyTitle="شهری یافت نشد"
        emptyDescription={
          selectedStateId
            ? "برای این استان شهری ثبت نشده است."
            : "هنوز هیچ شهری ثبت نشده است."
        }
        emptyAction={
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" />
            ایجاد شهر
          </Button>
        }
      />

      {!selectedStateId && (
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
              {editTarget ? "ویرایش شهر" : "شهر جدید"}
            </DialogTitle>
            <DialogDescription className="text-fog/70">
              {editTarget ? "اطلاعات شهر را ویرایش کنید" : "شهر جدید ایجاد کنید"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                control={form.control}
                name="name"
                label="نام شهر"
                placeholder="مثال: تهران"
                required
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                control={form.control}
                name="enName"
                label="نام انگلیسی"
                placeholder="مثال: Tehran"
                disabled={form.formState.isSubmitting}
              />

              <FormSearchSelect
                control={form.control}
                name="stateId"
                label="استان"
                placeholder="استان را انتخاب کنید..."
                fetcher={stateFetcher}
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
                    : editTarget ? "ذخیره تغییرات" : "ایجاد شهر"
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
        title="حذف شهر"
        description={`آیا از حذف شهر "${deleteTarget?.name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
