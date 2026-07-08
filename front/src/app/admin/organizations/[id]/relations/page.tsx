"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form/form-card";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { Form } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchSelect } from "@/components/form/form-search-select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { get as getOrg } from "@/app/actions/organization/get";
import { updateRelations } from "@/app/actions/organization/updateRelations";
import { gets as getStates } from "@/app/actions/state/gets";
import { gets as getCities } from "@/app/actions/city/gets";
import type { ReqType } from "@/types/declarations/selectInp";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const relationsSchema = z.object({
  removeState: z.boolean().optional(),
  removeCity: z.boolean().optional(),
});

type RelationsData = z.input<typeof relationsSchema>;

export default function OrgRelationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const form = useForm<RelationsData>({
    resolver: zodV4Resolver(relationsSchema),
    defaultValues: {
      removeState: false,
      removeCity: false,
    },
  });

  useEffect(() => {
    const load = async () => {
      const result = await getOrg(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        { _id: 1, name: 1, state: { _id: 1, name: 1 }, city: { _id: 1, name: 1 } }
      );
      if (result.success && result.body?.[0]) {
        const org = result.body[0];
        setState(org.state?._id || "");
        setCity(org.city?._id || "");
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const removeState = form.watch("removeState");
  const removeCity = form.watch("removeCity");

  const onSubmit = async (data: RelationsData) => {
    setSubmitting(true);
    const result = await updateRelations(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        ...(state && !data.removeState ? { state } : {}),
        ...(city && !data.removeCity ? { city } : {}),
        ...(data.removeState ? { removeState: true } : {}),
        ...(data.removeCity ? { removeCity: true } : {}),
      },
      { _id: 1, name: 1 }
    );
    setSubmitting(false);
    if (result.success) {
      toast.success("روابط با موفقیت به‌روزرسانی شد");
      router.push("/admin/organizations");
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی روابط");
    }
  };

  if (loading) return <LoadingSkeleton type="card" count={1} />;

  if (notFound) {
    return (
      <div>
        <ErrorState
          title="سازمان مورد نظر یافت نشد"
          message="سازمانی با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/organizations">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 border border-electric-iris/20">
            <Share2 className="size-5 text-electric-iris" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              ویرایش روابط سازمان
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              استان، شهر و سایر روابط مرتبط با سازمان را تعیین کنید.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormCard title="موقعیت مکانی" description="استان و شهر مرتبط با سازمان">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">استان</label>
              <SearchSelect
                value={state}
                onChange={(v) => { setState(v); setCity(""); }}
                placeholder="انتخاب استان..."
                fetcher={async (search?: string) => {
                  const result = await getStates(
                    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                    { _id: 1, name: 1 }
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((s: { _id?: string; name?: string }) => ({
                    _id: s._id || "",
                    name: s.name || "",
                  }))
                }}
                label="استان"
                disabled={submitting}
              />
              {state && (
                <FormCheckbox
                  control={form.control}
                  name="removeState"
                  label="حذف استان"
                  disabled={submitting}
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">شهر</label>
              <SearchSelect
                value={city}
                onChange={setCity}
                placeholder="انتخاب شهر..."
                fetcher={async (search?: string) => {
                  const result = await getCities(
                    {
                      activeRoleId: getActiveRoleIdFromStore(),
                      page: 1,
                      limit: 50,
                      search: search || undefined,
                      ...(state ? { stateId: state } : {}),
                    } as unknown as ReqType["main"]["city"]["gets"]["set"],
                    { _id: 1, name: 1 }
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((c: { _id?: string; name?: string }) => ({
                    _id: c._id || "",
                    name: c.name || "",
                  }))
                }}
                label="شهر"
                disabled={submitting}
              />
              {city && (
                <FormCheckbox
                  control={form.control}
                  name="removeCity"
                  label="حذف شهر"
                  disabled={submitting}
                />
              )}
            </div>
          </div>
        </FormCard>

        <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <Link href={`/admin/organizations/${id}`}>
            <Button type="button" variant="ghost" disabled={submitting}>
              انصراف
            </Button>
          </Link>
          <Button type="submit" disabled={submitting} className="gap-1.5 min-w-[120px]">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              "ذخیره روابط"
            )}
          </Button>
        </div>
      </form>
      </Form>
    </div>
  );
}
