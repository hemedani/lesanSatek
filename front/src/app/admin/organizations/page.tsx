import { gets } from "@/app/actions/organization/gets";
import { OrganizationsClient } from "./orgs-client";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 20;

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    {
      _id: 1,
      name: 1,
      enName: 1,
      description: 1,
      isActive: 1,
      createdAt: 1,
      head: { _id: 1, first_name: 1, last_name: 1 },
    }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/organizations?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/organizations?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <OrganizationsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
