"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form/form-card";
import { SearchSelect } from "@/components/form/form-search-select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { get } from "@/app/actions/unit/get";
import { updateRelations } from "@/app/actions/unit/updateRelations";
import { gets as getOrgs } from "@/app/actions/organization/gets";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { getUsers } from "@/app/actions/user/getUsers";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export default function UnitRelationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [parentUnitId, setParentUnitId] = useState("");
  const [headId, setHeadId] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          organization: { _id: 1, name: 1 },
          parentUnit: { _id: 1, name: 1 },
          head: { _id: 1, first_name: 1, last_name: 1 },
        }
      );
      if (result.success && result.body?.[0]) {
        const unit = result.body[0];
        setOrgId(unit.organization?._id || "");
        setParentUnitId(unit.parentUnit?._id || "");
        setHeadId(unit.head?._id || "");
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateRelations(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        ...(orgId ? { organizationId: orgId } : {}),
        ...(parentUnitId ? { parentUnitId } : {}),
        ...(headId ? { headId } : {}),
      },
      { _id: 1, name: 1 }
    );
    setSubmitting(false);
    if (result.success) {
      toast.success("روابط با موفقیت به‌روزرسانی شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی روابط");
    }
  };

  if (loading) return <LoadingSkeleton type="card" count={1} />;

  if (notFound) {
    return (
      <div>
        <ErrorState
          title="واحد مورد نظر یافت نشد"
          message="واحدی با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/units">
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
              ویرایش روابط واحد
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              سازمان، واحد والد و سرپرست واحد را تعیین کنید.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <FormCard title="روابط واحد" description="سازمان، والد و سرپرست مرتبط با واحد">
          <div className="space-y-2">
            <label className="text-xs text-fog/70 block font-medium">سازمان</label>
            <SearchSelect
              value={orgId}
              onChange={setOrgId}
              placeholder="انتخاب سازمان..."
              fetcher={async (search?: string) => {
                const result = await getOrgs(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, name: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((o: { _id?: string; name?: string }) => ({
                  _id: o._id || "",
                  name: o.name || "",
                }));
              }}
              label="سازمان"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-fog/70 block font-medium">واحد والد</label>
            <SearchSelect
              value={parentUnitId}
              onChange={setParentUnitId}
              placeholder="انتخاب واحد والد..."
              fetcher={async (search?: string) => {
                const result = await getUnits(
                  {
                    activeRoleId: getActiveRoleIdFromStore(),
                    page: 1,
                    limit: 50,
                    search: search || undefined,
                    ...(orgId ? { organizationId: orgId } : {}),
                  },
                  { _id: 1, name: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((u: { _id?: string; name?: string }) => ({
                  _id: u._id || "",
                  name: u.name || "",
                }));
              }}
              label="واحد والد"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-fog/70 block font-medium">سرپرست واحد</label>
            <SearchSelect
              value={headId}
              onChange={setHeadId}
              placeholder="انتخاب سرپرست..."
              fetcher={async (search?: string) => {
                const result = await getUsers(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, first_name: 1, last_name: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((u: { _id?: string; first_name?: string; last_name?: string }) => ({
                  _id: u._id || "",
                  name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—",
                }));
              }}
              label="سرپرست"
              disabled={submitting}
            />
          </div>
        </FormCard>

        <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <Link href={`/admin/units/${id}`}>
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
    </div>
  );
}
