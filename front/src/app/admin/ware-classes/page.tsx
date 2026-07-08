import { gets as getWareClasses } from "@/app/actions/wareClass/gets";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { WareClassesClient } from "./ware-classes-client";

export default async function WareClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; wareTypeId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const [classesResult, typesResult] = await Promise.all([
    getWareClasses(
      { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
      { _id: 1, name: 1, enName: 1, createdAt: 1, wareType: { _id: 1, name: 1 } }
    ),
    getWareTypes(
      { activeRoleId: "", page: 1, limit: 100, search: undefined },
      { _id: 1, name: 1 }
    ),
  ]);

  const items = classesResult.success ? classesResult.body : [];
  const wareTypes = typesResult.success ? typesResult.body : [];

  const prevPageUrl = page > 1
    ? `/admin/ware-classes?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.wareTypeId ? `&wareTypeId=${resolvedSearchParams.wareTypeId}` : ""}`
    : "";
  const nextPageUrl = items.length >= limit
    ? `/admin/ware-classes?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.wareTypeId ? `&wareTypeId=${resolvedSearchParams.wareTypeId}` : ""}`
    : "";

  return (
    <WareClassesClient
      items={items}
      wareTypes={wareTypes}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
      selectedWareTypeId={resolvedSearchParams.wareTypeId || ""}
    />
  );
}
