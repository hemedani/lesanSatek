"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Calendar, Plus, Pencil, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { gets } from "@/app/actions/fiscalYear/gets";
import { add } from "@/app/actions/fiscalYear/add";
import { update } from "@/app/actions/fiscalYear/update";

interface FiscalYear {
  _id: string;
  name?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

const fySchema = z.object({
  name: z.string().min(1, "نام سال مالی الزامی است"),
  startDate: z.string().min(1, "تاریخ شروع الزامی است"),
  endDate: z.string().min(1, "تاریخ پایان الزامی است"),
  status: z.string().default("open"),
});

type FYData = z.input<typeof fySchema>;

export default function FiscalYearsPage() {
  const router = useRouter();
  const [items, setItems] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<FiscalYear | null>(null);

  const form = useForm<FYData>({
    resolver: zodV4Resolver(fySchema),
    defaultValues: { name: "", startDate: "", endDate: "", status: "open" },
  });

  const fetchItems = async () => {
    const result = await gets({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100 }, { _id: 1, name: 1, status: 1, startDate: 1, endDate: 1, isActive: 1 });
    if (result.success) setItems(result.body || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => { setEditTarget(null); form.reset({ name: "", startDate: "", endDate: "", status: "open" }); setShowDialog(true); };
  const openEdit = (item: FiscalYear) => { setEditTarget(item); form.reset({ name: item.name || "", startDate: item.startDate?.slice(0, 10) || "", endDate: item.endDate?.slice(0, 10) || "", status: item.status || "open" }); setShowDialog(true); };

  const onSubmit = async (values: FYData) => {
    const res = editTarget
      ? await update({ activeRoleId: getActiveRoleIdFromStore(), _id: editTarget._id, name: values.name, startDate: new Date(values.startDate), endDate: new Date(values.endDate) }, { _id: 1 })
      : await add({ activeRoleId: getActiveRoleIdFromStore(), name: values.name, startDate: new Date(values.startDate), endDate: new Date(values.endDate) }, { _id: 1 });
    if (res.success) { toast.success(editTarget ? "به‌روزرسانی شد." : "ایجاد شد."); setShowDialog(false); fetchItems(); }
    else toast.error(res.body?.message || "خطا");
  };

  const columns: Column<FiscalYear>[] = [
    { key: "name", label: "نام", render: (item) => (<div className="flex items-center gap-3"><Calendar className="size-4 text-electric-iris" /><span className="text-moonlight font-medium">{item.name || "—"}</span></div>) },
    { key: "status", label: "وضعیت", render: (item) => (<Badge variant="outline" className={cn("text-[11px]", item.status === "open" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20")}>{item.status === "open" ? "باز" : "بسته"}</Badge>) },
    { key: "startDate", label: "شروع", render: (item) => <span className="text-fog text-sm font-mono" dir="ltr">{item.startDate ? new Date(item.startDate).toLocaleDateString("fa-IR") : "—"}</span> },
    { key: "endDate", label: "پایان", render: (item) => <span className="text-fog text-sm font-mono" dir="ltr">{item.endDate ? new Date(item.endDate).toLocaleDateString("fa-IR") : "—"}</span> },
    { key: "actions", label: "", render: (item) => <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button> },
  ];

  if (loading) return <div className="space-y-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="سال‌های مالی" description="مدیریت سال‌های مالی"><Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" /> سال مالی جدید</Button></PageHeader>
      <DataTable columns={columns} data={items} keyExtractor={(i) => i._id} cardView={false} renderCard={(item) => (<div className="glass-card glass-card-hover-active rounded-xl p-4" onClick={() => openEdit(item)}><Calendar className="size-5 text-electric-iris" /><p className="font-semibold text-moonlight mt-2">{item.name}</p></div>)} emptyTitle="سال مالی یافت نشد" emptyDescription="اولین سال مالی را ایجاد کنید." />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-glacier">{editTarget ? "ویرایش سال مالی" : "سال مالی جدید"}</DialogTitle><DialogDescription className="text-fog/70">اطلاعات سال مالی را وارد کنید</DialogDescription></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormInput control={form.control} name="name" label="نام سال مالی" required />
            <div className="grid grid-cols-2 gap-3">
              <FormInput control={form.control} name="startDate" label="تاریخ شروع" type="date" required />
              <FormInput control={form.control} name="endDate" label="تاریخ پایان" type="date" required />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>انصراف</Button>
              <Button type="submit">{editTarget ? "ذخیره" : "ایجاد"}</Button>
            </div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
