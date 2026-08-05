"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight, Share2, Building2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form/form-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { HelpLauncher } from "@/components/help/help-launcher";
import { SearchSelect } from "@/components/form/form-search-select";
import { get } from "@/app/actions/process/get";
import { updateRelations } from "@/app/actions/process/updateRelations";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { gets as getWareClasses } from "@/app/actions/wareClass/gets";
import { gets as getWareGroups } from "@/app/actions/wareGroup/gets";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";
import { gets as getWares } from "@/app/actions/ware/gets";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { useAuthStore } from "@/stores/authStore";

type ScopeItem = { _id: string; name: string };

const baseScopeFetcher = (action: (data: Record<string, unknown>, sel: Record<string, unknown>) => Promise<{ success: boolean; body?: ScopeItem[] }>) =>
  async (search?: string, extraFilters: Record<string, string> = {}) => {
    const result = await action(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        page: 1,
        limit: 50,
        search: search || undefined,
        ...extraFilters,
      },
      { _id: 1, name: 1 }
    );
    if (!result.success || !result.body) return [];
    return result.body.map((item) => ({
      _id: item._id || "",
      name: item.name || "",
    }));
  };

export default function ProcessRelationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orgId, setOrgId] = useState(() => {
    const scope = useAuthStore.getState().getActiveScope();
    return scope?.type === "organization" ? scope.id : "";
  });
  const [orgName, setOrgName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [wareTypeId, setWareTypeId] = useState("");
  const [wareClassId, setWareClassId] = useState("");
  const [wareGroupId, setWareGroupId] = useState("");
  const [wareModelId, setWareModelId] = useState("");
  const [wareId, setWareId] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          organization: { _id: 1, name: 1 },
          unit: { _id: 1, name: 1 },
          wareType: { _id: 1, name: 1 },
          wareClass: { _id: 1, name: 1 },
          wareGroup: { _id: 1, name: 1 },
          wareModel: { _id: 1, name: 1 },
          ware: { _id: 1, name: 1 },
        }
      );
      if (result.success && result.body?.[0]) {
        const p = result.body[0];
        setOrgId(p.organization?._id || orgId || "");
        setOrgName(p.organization?.name || "");
        setUnitId(p.unit?._id || "");
        setWareTypeId(p.wareType?._id || "");
        setWareClassId(p.wareClass?._id || "");
        setWareGroupId(p.wareGroup?._id || "");
        setWareModelId(p.wareModel?._id || "");
        setWareId(p.ware?._id || "");
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetcherUnits = baseScopeFetcher(getUnits as never);
  const fetcherWareTypes = baseScopeFetcher(getWareTypes as never);
  const fetcherWareClasses = baseScopeFetcher(getWareClasses as never);
  const fetcherWareGroups = baseScopeFetcher(getWareGroups as never);
  const fetcherWareModels = baseScopeFetcher(getWareModels as never);
  const fetcherWares = baseScopeFetcher(getWares as never);

  const handleWareTypeChange = (val: string) => {
    setWareTypeId(val);
    setWareClassId("");
    setWareGroupId("");
    setWareModelId("");
    setWareId("");
  };

  const handleWareClassChange = (val: string) => {
    setWareClassId(val);
    setWareGroupId("");
    setWareModelId("");
    setWareId("");
  };

  const handleWareGroupChange = (val: string) => {
    setWareGroupId(val);
    setWareModelId("");
    setWareId("");
  };

  const handleWareModelChange = (val: string) => {
    setWareModelId(val);
    setWareId("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateRelations(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        ...(orgId ? { organizationId: orgId } : {}),
        ...(unitId ? { unitId } : {}),
        ...(wareTypeId ? { wareTypeId } : {}),
        ...(wareClassId ? { wareClassId } : {}),
        ...(wareGroupId ? { wareGroupId } : {}),
        ...(wareModelId ? { wareModelId } : {}),
        ...(wareId ? { wareId } : {}),
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
          title="فرآیند مورد نظر یافت نشد"
          message="فرآیندی با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/orghead/processes">
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
              ویرایش روابط فرآیند
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              حوزه کاربرد فرآیند را تعیین کنید. فرآیند به سازمان فعال شما تعلق دارد.
            </p>
          </div>
          <div className="ms-auto">
            <HelpLauncher topicId="orghead-process-relations" tooltip="راهنمای ارتباط‌های فرآیند" />
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <FormCard title="سازمان" description="سازمان مرتبط با فرآیند (از نقش فعال شما)" icon={Building2} iconClassName="text-electric-iris">
          <div className="flex items-center gap-3 rounded-lg border border-steel-border/20 bg-white/[0.02] px-3 py-2.5">
            <Building2 className="size-4 text-fog/40 shrink-0" />
            <span className="text-sm text-moonlight">
              {orgName || (orgId ? "سازمان فعلی" : "نامشخص")}
            </span>
          </div>
        </FormCard>

        <FormCard
          title="حوزه کاربرد"
          description="فرآیند را به واحد یا سلسله‌مراتب کالا محدود کنید. در صورت عدم انتخاب، فرآیند عمومی خواهد بود. هر سطح، گزینه‌های سطح بعد را فیلتر می‌کند."
          icon={GitBranch}
          iconClassName="text-electric-iris"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">واحد</label>
              <SearchSelect
                value={unitId}
                onChange={setUnitId}
                placeholder="انتخاب واحد..."
                fetcher={(search?: string) => fetcherUnits(search)}
                label="واحد"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">نوع کالا</label>
              <SearchSelect
                value={wareTypeId}
                onChange={handleWareTypeChange}
                placeholder="انتخاب نوع کالا..."
                fetcher={(search?: string) => fetcherWareTypes(search)}
                label="نوع کالا"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">رده کالا</label>
              <SearchSelect
                value={wareClassId}
                onChange={handleWareClassChange}
                placeholder="انتخاب رده کالا..."
                fetcher={(search?: string) => fetcherWareClasses(search, wareTypeId ? { wareTypeId } : {})}
                label="رده کالا"
                disabled={submitting || !wareTypeId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">گروه کالا</label>
              <SearchSelect
                value={wareGroupId}
                onChange={handleWareGroupChange}
                placeholder="انتخاب گروه کالا..."
                fetcher={(search?: string) =>
                  fetcherWareGroups(search, {
                    ...(wareTypeId ? { wareTypeId } : {}),
                    ...(wareClassId ? { wareClassId } : {}),
                  })
                }
                label="گروه کالا"
                disabled={submitting || !wareTypeId || !wareClassId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">مدل کالا</label>
              <SearchSelect
                value={wareModelId}
                onChange={handleWareModelChange}
                placeholder="انتخاب مدل کالا..."
                fetcher={(search?: string) =>
                  fetcherWareModels(search, {
                    ...(wareTypeId ? { wareTypeId } : {}),
                    ...(wareClassId ? { wareClassId } : {}),
                    ...(wareGroupId ? { wareGroupId } : {}),
                  })
                }
                label="مدل کالا"
                disabled={submitting || !wareTypeId || !wareClassId || !wareGroupId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fog/70 block font-medium">کالا</label>
              <SearchSelect
                value={wareId}
                onChange={setWareId}
                placeholder="انتخاب کالا..."
                fetcher={(search?: string) =>
                  fetcherWares(search, {
                    ...(wareTypeId ? { wareTypeId } : {}),
                    ...(wareClassId ? { wareClassId } : {}),
                    ...(wareGroupId ? { wareGroupId } : {}),
                    ...(wareModelId ? { wareModelId } : {}),
                  })
                }
                label="کالا"
                disabled={submitting || !wareTypeId || !wareClassId || !wareGroupId || !wareModelId}
              />
            </div>
          </div>
        </FormCard>

        <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <Link href={`/orghead/processes/${id}`}>
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
