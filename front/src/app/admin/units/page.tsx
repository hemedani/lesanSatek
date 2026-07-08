import { gets } from "@/app/actions/unit/gets";
import { UnitsClient } from "./units-client";

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; orgId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 50;

  const result = await gets(
    {
      activeRoleId: "",
      page,
      limit,
      search: resolvedSearchParams.search || undefined,
    },
    {
      _id: 1,
      name: 1,
      type: 1,
      isActive: 1,
      description: 1,
      organization: { _id: 1, name: 1 },
      parentUnit: { _id: 1, name: 1 },
      head: { _id: 1, first_name: 1, last_name: 1 },
    }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/units?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/units?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <UnitsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
      orgId={resolvedSearchParams.orgId || ""}
    />
  );
}
