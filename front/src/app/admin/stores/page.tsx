import { gets as getStores } from "@/app/actions/store/gets";
import { StoresClient } from "./stores-client";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await getStores(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, name: 1, status: 1, score: 1, address: 1, createdAt: 1, city: { _id: 1, name: 1 } }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/stores?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/stores?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <StoresClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
