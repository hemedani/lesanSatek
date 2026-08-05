"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScrollText,
  ArrowRight,
  CalendarDays,
  Building2,
  User,
  MessageSquareText,
  ClipboardList,
  Factory,
  FolderTree,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HelpLauncher } from "@/components/help/help-launcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { remove } from "@/app/actions/consumption/remove";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export interface ConsumptionDetail {
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

function faDateTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${date.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })} — ${date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-steel-border/20 last:border-b-0">
      <div className="size-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
        <Icon className="size-4 text-fog/50" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fog/50">{label}</p>
        <div className="text-sm text-moonlight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function ConsumptionDetailClient({ item }: { item: ConsumptionDetail }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryName = item.wareType?.name || item.wareClass?.name || item.wareGroup?.name;
  const consumedByName = item.consumedBy
    ? `${item.consumedBy.first_name || ""} ${item.consumedBy.last_name || ""}`.trim()
    : "";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await remove({ _id: item._id });
      if (result.success) {
        toast.success("مصرف با موفقیت حذف شد");
        router.push("/admin/consumption");
      } else {
        toast.error(result.body?.message || "خطا در حذف مصرف");
        setDeleting(false);
        setConfirmDelete(false);
      }
    } catch {
      toast.error("خطا در حذف مصرف");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-steel-border/50">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/admin/consumption")}
            className="shrink-0 rounded-lg"
          >
            <ArrowRight className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
              {item.ware?.name || "مصرف کالا"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {item.reason && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                  {item.reason}
                </Badge>
              )}
              <span className="text-xs text-fog/50 truncate">{item.unit?.name || "—"}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <HelpLauncher topicId="admin-consumption" tooltip="راهنمای مصرف کالا" />
          <Button
            variant="ghost"
            className="gap-2 px-4 text-ember hover:text-ember hover:bg-ember/5"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-5" />
            حذف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <ScrollText className="size-4 text-amber-400" />
                </div>
                <div>
                  <CardTitle>مقدار مصرف</CardTitle>
                  <CardDescription>مقدار مصرف‌شده و موجودی پس از مصرف</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
                <div className="min-w-0 bg-[#05060f]/60 p-5 text-center">
                  <p className="text-xs text-fog/60">مقدار مصرف</p>
                  <p className="mt-2 text-3xl font-bold font-mono leading-9 text-amber-400" dir="ltr">
                    {item.quantity != null ? `${item.quantity.toLocaleString("fa-IR")} عدد` : "۰"}
                  </p>
                </div>
                <div className="min-w-0 bg-[#05060f]/60 p-5 text-center">
                  <p className="text-xs text-fog/60">موجودی پس از مصرف</p>
                  <p className="mt-2 text-2xl font-semibold font-mono leading-9 text-fog/80" dir="ltr">
                    {item.inventory?.quantity != null ? `${item.inventory.quantity.toLocaleString("fa-IR")} عدد` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(item.reason || item.notes || item.consumedFor) && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>جزئیات مصرف</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-5">
                  {item.consumedFor && (
                    <InfoRow icon={User} label="مصرف‌شونده" value={item.consumedFor} />
                  )}
                  {item.reason && (
                    <InfoRow icon={MessageSquareText} label="دلیل مصرف" value={item.reason} />
                  )}
                  {item.notes && (
                    <InfoRow icon={ClipboardList} label="یادداشت" value={item.notes} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>مشخصات کالا</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={Package} label="کالا" value={item.ware?.name || "—"} />
                {item.ware?.brand && (
                  <InfoRow icon={Factory} label="برند" value={item.ware.brand} />
                )}
                {item.wareModel?.name && (
                  <InfoRow icon={FolderTree} label="مدل کالا" value={item.wareModel.name} />
                )}
                {categoryName && (
                  <InfoRow
                    icon={FolderTree}
                    label="دسته‌بندی"
                    value={[item.wareType?.name, item.wareClass?.name, item.wareGroup?.name].filter(Boolean).join(" / ") || "—"}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>اطلاعات ثبت</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={Building2} label="واحد" value={item.unit?.name || "—"} />
                {consumedByName && (
                  <InfoRow icon={User} label="ثبت‌کننده" value={consumedByName} />
                )}
                <InfoRow icon={CalendarDays} label="تاریخ مصرف" value={faDateTime(item.consumedAt)} />
                <InfoRow icon={CalendarDays} label="تاریخ ثبت" value={faDateTime(item.createdAt)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(false) }}
        title="حذف مصرف"
        description={`آیا از حذف مصرف «${item.ware?.name || "این کالا"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}