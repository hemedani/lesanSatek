"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ScrollText,
  Plus,
  Boxes,
  Package,
  User,
  Building2,
  MessageSquareText,
  CalendarDays,
  ClipboardList,
  FolderTree,
  Factory,
  ArrowDownUp,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { SearchField } from "@/components/ui/search-field";
import { FilterSelect } from "@/components/ui/filter-select";
import type { FilterOption } from "@/components/ui/filter-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import { FormSearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { add } from "@/app/actions/consumption/add";
import { gets as getInventories } from "@/app/actions/inventory/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export interface ConsumptionRecord {
  _id: string;
  quantity?: number;
  notes?: string;
  reason?: string;
  consumedFor?: string;
  consumedAt?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string; type?: string };
  consumedBy?: { _id: string; first_name?: string; last_name?: string };
  inventory?: { _id: string; quantity?: number };
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  wareModel?: { _id: string; name?: string; enName?: string };
  wareGroup?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
}

export interface ConsumptionCounts {
  total: number
  totalQuantity: number
  averagePerRecord: number
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[];
  counts: ConsumptionCounts;
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین مصرف" },
  { value: "quantity-asc", label: "کمترین مصرف" },
];

type SortKey = "createdAt-desc" | "createdAt-asc" | "quantity-desc" | "quantity-asc";

function isSortKey(value: string): value is SortKey {
  return sortOptions.some((o) => o.value === value);
}

function matchesSearch(item: ConsumptionRecord, q: string): boolean {
  if (!q) return true;
  const haystack = [
    item.ware?.name,
    item.ware?.enName,
    item.ware?.brand,
    item.wareModel?.name,
    item.wareType?.name,
    item.wareClass?.name,
    item.wareGroup?.name,
    item.unit?.name,
    item.consumedFor,
    item.reason,
    item.notes,
    item.consumedBy?.first_name,
    item.consumedBy?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

const consumptionSchema = z.object({
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  quantity: z.string().min(1, "مقدار الزامی است"),
  reason: z.string().optional(),
  consumedFor: z.string().optional(),
  notes: z.string().optional(),
  consumedAt: z.string().min(1, "تاریخ الزامی است"),
  consumedAtTime: z.string().optional(),
});

type ConsumptionData = z.infer<typeof consumptionSchema>;

const inventoryFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getInventories({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, ware: { _id: 1, name: 1 }, quantity: 1 });
  if (!result.success) return [];
  const seen = new Set<string>();
  return result.body.reduce((acc: SearchSelectOption[], s: { _id: string; ware?: { _id: string; name?: string }; quantity?: number }) => {
    const wareId = s.ware?._id || s._id;
    if (seen.has(wareId)) return acc;
    seen.add(wareId);
    acc.push({
      _id: wareId,
      name: s.ware?.name || "نامشخص",
      sublabel: s.quantity != null ? `${s.quantity.toLocaleString("fa-IR")} عدد` : undefined,
    });
    return acc;
  }, []);
};

function ConsumptionCard({ item }: { item: ConsumptionRecord }) {
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام";
  const consumedByName = item.consumedBy
    ? [item.consumedBy.first_name, item.consumedBy.last_name].filter(Boolean).join(" ")
    : "";

  return (
    <Link
      href={`/unit-head/consumption/${item._id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        {/* Top section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-inset ring-amber-500/15">
              <ScrollText className="size-5 text-amber-400" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                {wareName}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.wareModel?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">{item.wareModel.name}</span>
                )}
                {item.ware?.brand && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    <Factory className="size-3.5" />
                    {item.ware.brand}
                  </span>
                )}
              </div>
            </div>
          </div>
          {item.wareType?.name && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-fog ring-1 ring-inset ring-steel-border/25">
              {item.wareType.name}
            </span>
          )}
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">مقدار مصرف</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-amber-400 leading-7" dir="ltr">
              {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">مصرف‌شونده</p>
            <p className="mt-1 truncate text-sm font-medium text-moonlight leading-7">
              {item.consumedFor || "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">تاریخ مصرف</p>
            <p className="mt-1 text-sm font-medium text-moonlight leading-7">
              {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
            </p>
          </div>
        </div>

        {/* Bottom metadata section */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          {item.unit?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4 text-fog/60" />
              {item.unit.name}
            </span>
          )}
          {item.reason && (
            <span className="inline-flex items-center gap-1.5">
              <MessageSquareText className="size-4 text-fog/60" />
              {item.reason}
            </span>
          )}
          {consumedByName && (
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-fog/60" />
              {consumedByName}
            </span>
          )}
          {item.inventory?.quantity != null && (
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4 text-fog/60" />
              موجودی: {item.inventory.quantity.toLocaleString("fa-IR")}
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
            <CalendarDays className="size-4 text-fog/60" />
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
          </span>
          {item.notes && (
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-body-sm text-fog/70">
              <ClipboardList className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.notes}</span>
            </span>
          )}
        </div>

        {/* Category badges */}
        {(item.wareType?.name || item.wareClass?.name || item.wareGroup?.name) && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-steel-border/15 pt-3">
            <FolderTree className="size-3.5 text-fog/40" />
            {item.wareType?.name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareType.name}
              </Badge>
            )}
            {item.wareClass?.name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareClass.name}
              </Badge>
            )}
            {item.wareGroup?.name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareGroup.name}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ConsumptionClient({ items, counts }: ConsumptionClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt-desc");
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ConsumptionData>({
    resolver: zodV4Resolver(consumptionSchema),
    defaultValues: { wareId: "", quantity: "", reason: "", consumedFor: "", notes: "", consumedAt: new Date().toISOString(), consumedAtTime: new Date().toTimeString().slice(0, 5) },
  });

  const filtered = useMemo(() => {
    const q = search.trim();
    const list = items.filter((i) => matchesSearch(i, q));
    const sortAsc = sort.endsWith("-asc");
    let sorted = list;
    if (sort.startsWith("createdAt")) {
      sorted = [...list].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    } else {
      sorted = [...list].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
    }
    return sortAsc ? sorted : sorted.reverse();
  }, [items, search, sort]);

  const hasFilters = Boolean(search.trim() || sort !== "createdAt-desc");

  const handleReset = () => {
    setSearch("");
    setSort("createdAt-desc");
  };

  const onSubmit = async (data: ConsumptionData) => {
    setSubmitting(true);
    try {
      const [h, m] = (data.consumedAtTime || "00:00").split(":").map(Number)
      const consumedDate = new Date(data.consumedAt)
      consumedDate.setHours(h || 0, m || 0)
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          wareId: data.wareId,
          quantity: Number(data.quantity),
          reason: data.reason || undefined,
          consumedFor: data.consumedFor || undefined,
          notes: data.notes || undefined,
          consumedAt: consumedDate,
        },
        { _id: 1, quantity: 1 }
      );
      if (result.success) {
        toast.success("مصرف کالا با موفقیت ثبت شد");
        router.refresh();
        setShowDialog(false);
        form.reset();
      } else {
        toast.error(result.body?.message || "خطا در ثبت مصرف کالا");
      }
    } catch {
      toast.error("خطا در ثبت مصرف کالا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        <StatCard
          label="کل رکوردهای مصرف"
          value={counts.total}
          icon={ScrollText}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
        />
        <StatCard
          label="مجموع مصرف"
          value={counts.totalQuantity}
          icon={Boxes}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
        />
        <StatCard
          label="میانگین هر رکورد"
          value={counts.averagePerRecord}
          icon={Package}
          iconColor="text-glacier"
          iconBg="bg-frost-link/10"
        />
      </div>

      {/* 2. Filter bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="جستجو در کالا و مصرف‌شونده…"
          ariaLabel="جستجو در مصرف کالا"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش مصرف‌ها"
            value={sort}
            onValueChange={(v) => setSort(isSortKey(v || "") ? v as SortKey : "createdAt-desc")}
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
          <Button className="h-11 gap-2 px-4" onClick={() => { form.reset(); setShowDialog(true); }}>
            <Plus className="size-5" />
            ثبت مصرف
          </Button>
        </div>
      </div>

      {/* 3. Rich cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {filtered.map((item) => (
            <ConsumptionCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-steel-border/15 bg-graphite-plate/40 backdrop-blur-md">
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
              <ScrollText className="size-6 text-fog/30" />
            </div>
            <p className="text-sm font-medium text-fog/50">
              {hasFilters ? "مصرفی یافت نشد" : "هنوز مصرفی ثبت نشده است"}
            </p>
            <p className="text-xs text-fog/30 mt-1">
              {hasFilters
                ? "با تغییر جستجو یا مرتب‌سازی، رکورد موردنظر را پیدا کنید."
                : "از صفحه موجودی انبار می‌توانید برای کالاها، مصرف ثبت کنید."}
            </p>
            {hasFilters ? (
              <Button variant="ghost" className="mt-4 gap-2 px-4" onClick={handleReset}>
                <RotateCcw className="size-4" />
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/unit-head/inventory" className="mt-4 inline-block">
                <Button variant="ghost" className="gap-2 px-4">
                  رفتن به موجودی انبار
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">ثبت مصرف کالا</DialogTitle>
            <DialogDescription className="text-fog/70">مصرف کالا از موجودی واحد را ثبت کنید</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="کالا را انتخاب کنید..." fetcher={inventoryFetcher} required disabled={submitting} />
              <FormInput control={form.control} name="quantity" label="مقدار مصرفی" type="number" placeholder="۰" required disabled={submitting} />

              <div className="grid grid-cols-2 gap-3">
                <FormJalaliDatePicker control={form.control} name="consumedAt" label="تاریخ مصرف" required disabled={submitting} />
                <FormInput control={form.control} name="consumedAtTime" label="ساعت" type="time" disabled={submitting} />
              </div>

              <FormInput control={form.control} name="reason" label="دلیل مصرف" placeholder="دلیل مصرف..." disabled={submitting} />
              <FormInput control={form.control} name="consumedFor" label="مصرف‌شونده" placeholder="نام شخص..." disabled={submitting} />
              <FormInput control={form.control} name="notes" label="توضیحات" placeholder="توضیحات..." disabled={submitting} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} disabled={submitting}>انصراف</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "در حال ثبت..." : "ثبت مصرف"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
