import { gets as getWares } from "@/app/actions/ware/gets";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { WaresClient } from "./wares-client";

export default async function WaresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; wareTypeId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const [waresResult, typesResult] = await Promise.all([
    getWares(
      { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
      { _id: 1, name: 1, enName: 1, brand: 1, price: 1, orderedNumber: 1, createdAt: 1, wareType: { _id: 1, name: 1 }, wareClass: { _id: 1, name: 1 }, wareGroup: { _id: 1, name: 1 }, wareModel: { _id: 1, name: 1 }, manufacturer: { _id: 1, name: 1 } }
    ),
    getWareTypes(
      { activeRoleId: "", page: 1, limit: 100, search: undefined },
      { _id: 1, name: 1 }
    ),
  ]);

  const items = waresResult.success ? waresResult.body : [];
  const wareTypes = typesResult.success ? typesResult.body : [];

  const prevPageUrl = page > 1
    ? `/admin/wares?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.wareTypeId ? `&wareTypeId=${resolvedSearchParams.wareTypeId}` : ""}`
    : "";
  const nextPageUrl = items.length >= limit
    ? `/admin/wares?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.wareTypeId ? `&wareTypeId=${resolvedSearchParams.wareTypeId}` : ""}`
    : "";

  return (
    <WaresClient
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
