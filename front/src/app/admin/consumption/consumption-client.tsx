"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Plus, Trash2, User, Building2, MessageSquareText, CalendarDays, ClipboardList, Factory, ArrowDownUp, RotateCcw, ChevronLeft, Package } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import { FormSearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import type { FilterOption } from "@/components/ui/filter-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/consumption/add";
import { remove } from "@/app/actions/consumption/remove";
import { gets as getInventories } from "@/app/actions/inventory/gets";
import { gets as getWares } from "@/app/actions/ware/gets";

export interface ConsumptionRecord {
  _id: string;
  quantity?: number;
  consumedAt?: string;
  reason?: string;
  consumedFor?: string;
  notes?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string; type?: string };
  consumedBy?: { _id: string; first_name?: string; last_name?: string };
  inventory?: { _id: string; quantity?: number };
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  wareModel?: { _id: string; name?: string };
  wareGroup?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[];
  prevUrl: string;
  nextUrl: string;
  page: number;
  totalPages: number;
  total: number;
  reason: string;
  sort: string;
}

const reasonOptions: FilterOption[] = [
  { value: "breakage", label: "ضایعات" },
  { value: "expiry", label: "انقضا" },
  { value: "internal_use", label: "مصرف داخلی" },
  { value: "maintenance", label: "تعمیرات" },
  { value: "other", label: "سایر" },
];

const sortOptions: FilterOption[] = [
  { value: "consumedAt-desc", label: "جدیدترین مصرف" },
  { value: "consumedAt-asc", label: "قدیمی‌ترین مصرف" },
  { value: "quantity-desc", label: "بیشترین مقدار" },
  { value: "quantity-asc", label: "کمترین مقدار" },
];

const recordSchema = z.object({
  quantity: z.string().min(1, "مقدار الزامی است"),
  reason: z.string().optional(),
  consumedFor: z.string().optional(),
  notes: z.string().optional(),
  consumedAt: z.string().min(1, "تاریخ الزامی است"),
  consumedAtTime: z.string().optional(),
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  inventoryId: z.string().optional(),
});

type RecordData = z.infer<typeof recordSchema>;

function faDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const r = await getWares({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q }, { _id: 1, name: 1, wareModel: { _id: 1, name: 1 } });
  if (!r.success || !r.body) return [];
  return (r.body as { _id?: string; name?: string; wareModel?: { _id: string; name?: string } }[]).map((s) => ({
    _id: s._id || "",
    name: s.name || "",
    sublabel: s.wareModel?.name,
  }));
};

const invFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const r = await getInventories({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q }, { _id: 1, ware: { _id: 1, name: 1 }, quantity: 1 });
  if (!r.success || !r.body) return [];
  const seen = new Set<string>();
  return (r.body as { _id: string; ware?: { _id: string; name?: string }; quantity?: number }[]).reduce((acc: SearchSelectOption[], i) => {
    const wareId = i.ware?._id || i._id;
    if (seen.has(wareId)) return acc;
    seen.add(wareId);
    acc.push({ _id: wareId, name: i.ware?.name || "—", sublabel: i.quantity != null ? `${i.quantity.toLocaleString("fa-IR")} عدد` : undefined });
    return acc;
  }, []);
};

function ConsumptionCard({
  item,
  onDelete,
  onOpen,
}: {
  item: ConsumptionRecord;
  onDelete: (item: ConsumptionRecord) => void;
  onOpen: (item: ConsumptionRecord) => void;
}) {
  const categoryName = item.wareType?.name || item.wareClass?.name || item.wareGroup?.name;
  const consumedByName = item.consumedBy
    ? `${item.consumedBy.first_name || ""} ${item.consumedBy.last_name || ""}`.trim()
    : "";

  return (
    <div className="glass-card glass-card-hover-active flex h-full cursor-pointer flex-col gap-4 rounded-2xl p-5" onClick={() => onOpen(item)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-inset ring-amber-500/15">
            <ScrollText className="size-5 text-amber-400" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-base font-semibold text-moonlight" title={item.ware?.name}>
              {item.ware?.name || item.wareModel?.name || "—"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-fog/60">
              {item.ware?.brand && (
                <span className="inline-flex items-center gap-1">
                  <Factory className="size-4" />
                  {item.ware.brand}
                </span>
              )}
              {categoryName && (
                <span className="inline-flex items-center gap-1">
                  <ClipboardList className="size-4" />
                  {categoryName}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronLeft className="size-5 shrink-0 text-fog/30 transition-colors group-hover:text-frost-link/60" />
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">مقدار</p>
          <p className="mt-1 truncate text-sm font-bold font-mono leading-6 text-amber-400" dir="ltr">
            {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "۰"}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">تاریخ مصرف</p>
          <p className="mt-1 truncate text-xs font-medium leading-6 text-moonlight">{faDate(item.consumedAt)}</p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">موجودی پس از مصرف</p>
          <p className="mt-1 truncate text-xs font-medium font-mono leading-6 text-fog/80" dir="ltr">
            {item.inventory?.quantity != null ? item.inventory.quantity.toLocaleString("fa-IR") : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-body-sm text-fog/70">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {item.unit?.name && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Building2 className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.unit.name}</span>
            </span>
          )}
          {consumedByName && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <User className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{consumedByName}</span>
            </span>
          )}
        </div>
        {item.consumedFor && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <User className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">مصرف‌شونده: {item.consumedFor}</span>
          </span>
        )}
        {item.reason && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MessageSquareText className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.reason}</span>
          </span>
        )}
        {item.notes && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <ClipboardList className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.notes}</span>
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/60">
          <CalendarDays className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-9 text-fog/60 hover:text-ember hover:bg-ember/5"
          title="حذف"
          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
        >
          <Trash2 className="size-5" />
        </Button>
      </div>
    </div>
  );
}

export function ConsumptionClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  reason,
  sort,
}: ConsumptionClientProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConsumptionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<RecordData>({
    resolver: zodV4Resolver(recordSchema),
    defaultValues: { quantity: "", reason: "", consumedFor: "", notes: "", consumedAt: new Date().toISOString(), consumedAtTime: new Date().toTimeString().slice(0, 5), wareId: "", inventoryId: "" },
  });

  const onSubmit = async (values: RecordData) => {
    const [h, m] = (values.consumedAtTime || "00:00").split(":").map(Number)
    const consumedDate = new Date(values.consumedAt)
    consumedDate.setHours(h || 0, m || 0)
    try {
      const r = await add({
        activeRoleId: getActiveRoleIdFromStore(),
        quantity: Number(values.quantity),
        reason: values.reason || undefined,
        consumedFor: values.consumedFor || undefined,
        notes: values.notes || undefined,
        consumedAt: consumedDate,
        wareId: values.wareId,
        inventoryId: values.inventoryId || undefined,
      }, { _id: 1 });
      if (r.success) {
        toast.success("مصرف با موفقیت ثبت شد.");
        setShowDialog(false);
        router.refresh();
      } else {
        toast.error(r.body?.message || "خطا در ثبت مصرف");
      }
    } catch {
      toast.error("خطا در ثبت مصرف");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await remove({ _id: deleteTarget._id });
      if (result.success) {
        toast.success("مصرف با موفقیت حذف شد");
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در حذف مصرف");
      }
    } catch {
      toast.error("خطا در حذف مصرف");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const makeParams = (next: { reason?: string; sort?: string }) => {
    const params = new URLSearchParams();
    const nextReason = next.reason ?? reason;
    const nextSort = next.sort ?? sort;
    if (nextReason) params.set("reason", nextReason);
    if (nextSort && nextSort !== "consumedAt-desc") params.set("sort", nextSort);
    return params.toString();
  };

  const go = (qs: string) => router.push(`/admin/consumption${qs ? `?${qs}` : ""}`);

  const handleReason = (value: string | null) => go(makeParams({ reason: value ?? "" }));
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "consumedAt-desc" }));
  const handleReset = () => router.push("/admin/consumption");

  const hasFilters = Boolean(reason || (sort && sort !== "consumedAt-desc"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="مصرف"
        description="ثبت و مشاهده مصرف کالا در واحدها"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} مصرف
        </span>
        <Button className="gap-2 px-5" onClick={() => { form.reset(); setShowDialog(true); }}>
          <Plus className="size-5" />
          ثبت مصرف
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ScrollText}
            placeholder="دلیل مصرف"
            ariaLabel="فیلتر دلیل مصرف"
            value={reason}
            onValueChange={handleReason}
            options={reasonOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش مصرف"
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
            <ConsumptionCard
              key={item._id}
              item={item}
              onOpen={(it) => router.push(`/admin/consumption/${it._id}`)}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={hasFilters ? "مصرفی یافت نشد" : "هنوز مصرفی ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر فیلترها، مصرف موردنظر را پیدا کنید."
              : "با ثبت مصرف کالا، از موجودی انبار کسر شده و در گزارش‌ها منعکس می‌شود."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Button className="gap-2 px-5" onClick={() => { form.reset(); setShowDialog(true); }}>
                <Plus className="size-5" />
                ثبت مصرف
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
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">ثبت مصرف</DialogTitle>
            <DialogDescription className="text-fog/70">مصرف کالا را ثبت کنید</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="جستجوی کالا..." fetcher={wareFetcher} required disabled={form.formState.isSubmitting} />

              <FormSearchSelect control={form.control} name="inventoryId" label="موجودی (اختیاری)" placeholder="جستجوی موجودی..." fetcher={invFetcher} disabled={form.formState.isSubmitting} />

              <div className="grid grid-cols-2 gap-3">
                <FormInput control={form.control} name="quantity" label="مقدار" type="number" placeholder="۰" required disabled={form.formState.isSubmitting} />
                <FormJalaliDatePicker control={form.control} name="consumedAt" label="تاریخ" required disabled={form.formState.isSubmitting} />
              </div>
              <FormInput control={form.control} name="consumedAtTime" label="ساعت" type="time" disabled={form.formState.isSubmitting} />

              <FormInput control={form.control} name="reason" label="دلیل مصرف" disabled={form.formState.isSubmitting} />
              <FormInput control={form.control} name="consumedFor" label="مصرف‌شونده (اختیاری)" placeholder="نام شخص..." disabled={form.formState.isSubmitting} />
              <FormInput control={form.control} name="notes" label="یادداشت" disabled={form.formState.isSubmitting} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} disabled={form.formState.isSubmitting}>انصراف</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "در حال ثبت..." : "ثبت مصرف"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف مصرف"
        description={`آیا از حذف مصرف «${deleteTarget?.ware?.name || "این کالا"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}