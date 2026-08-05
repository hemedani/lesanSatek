"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Package, Factory, Store as StoreIcon, Tag, ArrowDownUp, RotateCcw, CalendarDays, ChevronRight, Barcode, BadgePercent } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { HelpLauncher } from "@/components/help/help-launcher";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { FilterSelect } from "@/components/ui/filter-select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import type { FilterOption } from "@/components/ui/filter-select";
import { remove } from "@/app/actions/stuff/remove";
import { add } from "@/app/actions/stuff/add";
import { update } from "@/app/actions/stuff/update";
import { gets as getWares } from "@/app/actions/ware/gets";
import { get as getWare } from "@/app/actions/ware/get";
import { gets as getStores } from "@/app/actions/store/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export interface Stuff {
  _id: string;
  quantity?: number;
  price?: number;
  hasAbsolutePrice?: boolean;
  pricePercentage?: number;
  expiration?: string;
  barcode?: number;
  qrc?: string;
  isExpirationNear?: boolean;
  createdAt?: string;
  ware?: { _id: string; name?: string; enName?: string; brand?: string; photoUrl?: string };
  store?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareGroup?: { _id: string; name?: string };
  wareModel?: { _id: string; name?: string };
}

interface StuffClientProps {
  items: Stuff[];
  prevUrl: string;
  nextUrl: string;
  page: number;
  totalPages: number;
  total: number;
  search: string;
  sort: string;
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-asc", label: "کمترین موجودی" },
  { value: "quantity-desc", label: "بیشترین موجودی" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
];

const stuffSchema = z.object({
  quantity: z.string().min(1, "تعداد الزامی است"),
  price: z.string().optional(),
  hasAbsolutePrice: z.enum(["absolute", "percentage"]),
  pricePercentage: z.string().optional(),
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  storeId: z.string().min(1, "انتخاب فروشگاه الزامی است"),
  expiration: z.string().optional(),
  barcode: z.string().optional(),
});

type StuffData = z.infer<typeof stuffSchema>;

function faDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWares(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1, enName: 1, brand: 1, price: 1 },
  );
  if (!result.success || !result.body) return [];
  return (result.body as { _id: string; name?: string; enName?: string; brand?: string; price?: number }[]).map((s) => ({
    _id: s._id,
    name: s.name || s.enName || "",
    sublabel: s.brand || (s.price != null ? `${s.price.toLocaleString("fa-IR")} ریال` : undefined),
  }));
};

const storeFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getStores({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 });
  if (!result.success || !result.body) return [];
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }));
};

function StuffCard({
  item,
  onEdit,
  onDelete,
  onOpen,
}: {
  item: Stuff;
  onEdit: (item: Stuff) => void;
  onDelete: (item: Stuff) => void;
  onOpen: (item: Stuff) => void;
}) {
  const categoryName = item.wareType?.name || item.wareClass?.name || item.wareGroup?.name;
  const isPercent = !item.hasAbsolutePrice;

  return (
    <div className="glass-card glass-card-hover-active flex h-full cursor-pointer flex-col gap-4 rounded-2xl p-5" onClick={() => onOpen(item)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
            isPercent ? "bg-electric-iris/10 ring-electric-iris/15" : "bg-emerald-500/10 ring-emerald-500/15",
          )}>
            {isPercent ? <BadgePercent className="size-5 text-electric-iris" /> : <Package className="size-5 text-emerald-400" />}
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
                  <Tag className="size-4" />
                  {categoryName}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-fog/30 transition-colors group-hover:text-frost-link/60" />
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">موجودی</p>
          <p className="mt-1 truncate text-sm font-bold leading-6 font-mono text-glacier" dir="ltr">
            {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "۰"}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">{isPercent ? "درصد" : "قیمت"}</p>
          <p className={cn("mt-1 truncate font-mono text-sm font-medium leading-6", isPercent ? "text-electric-iris" : "text-fog/80")} dir="ltr">
            {isPercent
              ? item.pricePercentage != null ? `٪${item.pricePercentage.toLocaleString("fa-IR")}` : "—"
              : item.price != null ? item.price.toLocaleString("fa-IR") : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-body-sm text-fog/70">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <StoreIcon className="size-4 shrink-0 text-fog/60" />
          <span className="truncate">{item.store?.name || "—"}</span>
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {item.expiration && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-fog/60" />
              {faDate(item.expiration)}
            </span>
          )}
          {item.barcode != null && (
            <span className="inline-flex items-center gap-1.5">
              <Barcode className="size-4 shrink-0 text-fog/60" />
              <span className="font-mono" dir="ltr">{item.barcode}</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/60">
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-9 text-fog/60 hover:text-moonlight"
            title="ویرایش"
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          >
            <Pencil className="size-5" />
          </Button>
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
    </div>
  );
}

export function StuffClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
}: StuffClientProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Stuff | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Stuff | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [wareBasePrice, setWareBasePrice] = useState(0);

  const form = useForm<StuffData>({
    resolver: zodV4Resolver(stuffSchema),
    defaultValues: { quantity: "", price: "", hasAbsolutePrice: "absolute", pricePercentage: "", wareId: "", storeId: "", expiration: "", barcode: "" },
  });

  const pricingMode = form.watch("hasAbsolutePrice");
  const pricePercentage = form.watch("pricePercentage");
  const enteredPrice = form.watch("price");
  const wareId = form.watch("wareId");

  const computedPrice =
    pricingMode === "percentage" && wareBasePrice > 0 && pricePercentage
      ? wareBasePrice * (1 + Number(pricePercentage) / 100)
      : pricingMode === "percentage"
        ? 0
        : Number(enteredPrice) || 0;

  useEffect(() => {
    if (!wareId) {
      setWareBasePrice(0);
      return;
    }
    getWare(
      { activeRoleId: getActiveRoleIdFromStore(), _id: wareId },
      { _id: 1, price: 1, wareType: { _id: 1 }, wareClass: { _id: 1 }, wareGroup: { _id: 1 }, wareModel: { _id: 1 } },
    ).then((res) => {
      if (res.success && res.body?.[0]) {
        setWareBasePrice(res.body[0].price || 0);
      }
    });
  }, [wareId]);

  const makeParams = useCallback(
    (next: { search?: string; sort?: string }) => {
      const params = new URLSearchParams();
      const nextSearch = (next.search ?? search).trim();
      const nextSort = next.sort ?? sort;
      if (nextSearch) params.set("search", nextSearch);
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort);
      return params.toString();
    },
    [search, sort],
  );

  const go = useCallback((qs: string) => router.push(`/admin/stuff${qs ? `?${qs}` : ""}`), [router]);

  const handleSearch = (value: string) => go(makeParams({ search: value }));
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }));
  const handleReset = () => router.push("/admin/stuff");

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc"));

  const openAdd = () => {
    form.reset({ quantity: "", price: "", hasAbsolutePrice: "absolute", pricePercentage: "", wareId: "", storeId: "", expiration: "", barcode: "" });
    setWareBasePrice(0);
    setEditTarget(null);
    setShowDialog(true);
  };

  const openEdit = (item: Stuff) => {
    form.reset({
      quantity: item.quantity?.toString() ?? "",
      price: item.price?.toString() ?? "",
      hasAbsolutePrice: item.hasAbsolutePrice === false ? "percentage" : "absolute",
      pricePercentage: item.pricePercentage?.toString() ?? "",
      wareId: item.ware?._id || "",
      storeId: item.store?._id || "",
      expiration: item.expiration || "",
      barcode: item.barcode != null ? item.barcode.toString() : "",
    });
    setWareBasePrice(0);
    setEditTarget(item);
    setShowDialog(true);
  };

  const onSubmit = async (data: StuffData) => {
    try {
      const isAbsolute = pricingMode === "absolute";
      const baseFields = {
        quantity: Number(data.quantity) || 0,
        price: isAbsolute ? Number(data.price) || 0 : Math.round(computedPrice),
        hasAbsolutePrice: isAbsolute,
        pricePercentage: !isAbsolute && data.pricePercentage ? Number(data.pricePercentage) : undefined,
        expiration: data.expiration ? new Date(data.expiration) : undefined,
        barcode: data.barcode ? Number(data.barcode) : undefined,
        isBarcodeSet: !!data.barcode,
      };
      const result = editTarget
        ? await update(
            { activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, ...baseFields },
            { _id: 1, quantity: 1 }
          )
        : await add(
            {
              activeRoleId: getActiveRoleIdFromStore(),
              ...baseFields,
              wareId: data.wareId,
              storeId: data.storeId,
              isQrcSet: false,
              wareTypeId: "",
              wareClassId: "",
              wareGroupId: "",
              wareModelId: "",
            },
            { _id: 1, quantity: 1 }
          );
      if (result.success) {
        toast.success(editTarget ? "موجودی با موفقیت به‌روزرسانی شد" : "موجودی با موفقیت ایجاد شد");
        setShowDialog(false);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در ذخیره موجودی");
      }
    } catch {
      toast.error("خطا در ذخیره موجودی");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
      if (result.success) {
        toast.success("موجودی با موفقیت حذف شد");
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در حذف موجودی");
      }
    } catch {
      toast.error("خطا در حذف موجودی");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="موجودی فروشگاه‌ها"
        description="مدیریت موجودی و قیمت‌گذاری کالا در فروشگاه‌ها"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} رکورد
        </span>
        <Button className="gap-2 px-5" onClick={openAdd}>
          <Plus className="size-5" />
          موجودی جدید
        </Button>
        <HelpLauncher topicId="admin-stuff" tooltip="راهنمای موجودی فروشگاه‌ها" />
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی کالا یا فروشگاه…"
          ariaLabel="جستجوی موجودی"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش موجودی"
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
            <StuffCard
              key={item._id}
              item={item}
              onOpen={(it) => router.push(`/admin/stuff/${it._id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={hasFilters ? "موجودی‌ای یافت نشد" : "هنوز موجودی‌ای ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا مرتب‌سازی، موجودی موردنظر را پیدا کنید."
              : "برای ثبت موجودی کالا در فروشگاه، اولین رکورد را ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Button className="gap-2 px-5" onClick={openAdd}>
                <Plus className="size-5" />
                ایجاد موجودی
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
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">{editTarget ? "ویرایش موجودی" : "موجودی جدید"}</DialogTitle>
            <DialogDescription className="text-fog/70">{editTarget ? "اطلاعات موجودی را ویرایش کنید" : "موجودی کالا را در فروشگاه ثبت کنید"}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput control={form.control} name="quantity" label="تعداد" type="number" placeholder="۰" required disabled={form.formState.isSubmitting} />
              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="کالا را انتخاب کنید..." fetcher={wareFetcher} required disabled={form.formState.isSubmitting} />
              <FormSearchSelect control={form.control} name="storeId" label="فروشگاه" placeholder="فروشگاه را انتخاب کنید..." fetcher={storeFetcher} required disabled={form.formState.isSubmitting} />

              <div className="space-y-3 rounded-lg border border-steel-border/15 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-moonlight">نحوه قیمت‌گذاری</p>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={pricingMode === "absolute"}
                      onChange={() => form.setValue("hasAbsolutePrice", "absolute")}
                      className="size-4 accent-electric-iris"
                    />
                    <span className="text-sm text-fog">قیمت مطلق</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={pricingMode === "percentage"}
                      onChange={() => form.setValue("hasAbsolutePrice", "percentage")}
                      className="size-4 accent-electric-iris"
                    />
                    <span className="text-sm text-fog">درصد افزایش</span>
                  </label>
                </div>

                {pricingMode === "absolute" ? (
                  <FormInput control={form.control} name="price" label="قیمت نهایی (ریال)" type="number" placeholder="۲۸۰۰۰۰۰" required disabled={form.formState.isSubmitting} />
                ) : (
                  <div className="space-y-2">
                    <FormInput control={form.control} name="pricePercentage" label="درصد افزایش" type="number" placeholder="۱۵" disabled={form.formState.isSubmitting} />
                    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-fog/70">قیمت محاسبه‌شده</span>
                        <span className="font-mono text-emerald-400" dir="ltr">
                          {computedPrice > 0 ? `${computedPrice.toLocaleString("fa-IR")} ریال` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormJalaliDatePicker control={form.control} name="expiration" label="تاریخ انقضا" disabled={form.formState.isSubmitting} />
                <FormInput control={form.control} name="barcode" label="بارکد" type="number" placeholder="مثال: ۱۲۳۴۵۶" disabled={form.formState.isSubmitting} />
              </div>

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
        description={`آیا از حذف موجودی «${deleteTarget?.ware?.name || "این کالا"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}