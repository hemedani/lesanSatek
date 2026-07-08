import { gets as getCities } from "@/app/actions/city/gets";
import { gets as getStates } from "@/app/actions/state/gets";
import { CitiesClient } from "./cities-client";

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; stateId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const [citiesResult, statesResult] = await Promise.all([
    getCities(
      { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
      { _id: 1, name: 1, enName: 1, createdAt: 1, state: { _id: 1, name: 1 } }
    ),
    getStates(
      { activeRoleId: "", page: 1, limit: 100, search: undefined },
      { _id: 1, name: 1 }
    ),
  ]);

  const items = citiesResult.success ? citiesResult.body : [];
  const states = statesResult.success ? statesResult.body : [];

  const prevPageUrl = page > 1 ? `/admin/cities?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.stateId ? `&stateId=${resolvedSearchParams.stateId}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/cities?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}${resolvedSearchParams.stateId ? `&stateId=${resolvedSearchParams.stateId}` : ""}` : "";

  return (
    <CitiesClient
      items={items}
      states={states}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
      selectedStateId={resolvedSearchParams.stateId || ""}
    />
  );
}
