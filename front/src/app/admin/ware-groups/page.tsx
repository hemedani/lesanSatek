import { gets as getWareGroups } from "@/app/actions/wareGroup/gets";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { WareGroupsClient } from "./ware-groups-client";

export default async function WareGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; wareTypeId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const [groupsResult, typesResult] = await Promise.all([
    getWareGroups(
      { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
      { _id: 1, name: 1, enName: 1, createdAt: 1, wareType: { _id: 1, name: 1 }, wareClasses: { _id: 1, name: 1 } }
    ),
    getWareTypes(
      { activeRoleId: "", page: 1, limit: 100, search: undefined },
      { _id: 1, name: 1 }
    ),
  ]);

  const items = groupsResult.success ? groupsResult.body : [];
  const wareTypes = typesResult.success ? typesResult.body : [];

  const prevPageUrl = page > 1
    ? `/admin/ware-groups?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.wareTypeId ? `&wareTypeId=${resolvedSearchParams.wareTypeId}` : ""}`
    : "";
  const nextPageUrl = items.length >= limit
    ? `/admin/ware-groups?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.wareTypeId ? `&wareTypeId=${resolvedSearchParams.wareTypeId}` : ""}`
    : "";

  return (
    <WareGroupsClient
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
