import { gets } from "@/app/actions/manufacturer/gets";
import { ManufacturersClient } from "./manufacturers-client";

export default async function ManufacturersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, name: 1, enName: 1, country: 1, createdAt: 1 }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/manufacturers?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/manufacturers?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <ManufacturersClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
