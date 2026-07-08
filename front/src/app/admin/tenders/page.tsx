import { gets } from "@/app/actions/tender/gets";
import { TendersClient } from "./tenders-client";

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, title: 1, status: 1, description: 1, deadline: 1, createdAt: 1 }
  );

  const items = result.success ? result.body : [];

  const params = new URLSearchParams();
  if (resolvedSearchParams.search) params.set("search", resolvedSearchParams.search);
  if (resolvedSearchParams.status) params.set("status", resolvedSearchParams.status);

  const prevPageUrl = page > 1 ? `/admin/tenders?page=${page - 1}&${params.toString()}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/tenders?page=${page + 1}&${params.toString()}` : "";

  return (
    <TendersClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
      statusFilter={resolvedSearchParams.status || ""}
    />
  );
}
