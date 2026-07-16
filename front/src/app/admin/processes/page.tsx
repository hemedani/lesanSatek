import { gets } from "@/app/actions/process/gets";
import { ProcessesClient } from "./processes-client";

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 20;

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
      description: 1,
      status: 1,
      version: 1,
      isActive: 1,
      createdAt: 1,
      organization: { _id: 1, name: 1 },
      createdBy: { _id: 1, first_name: 1, last_name: 1 },
      unit: { _id: 1, name: 1 },
      wareType: { _id: 1, name: 1 },
      wareClass: { _id: 1, name: 1 },
      wareGroup: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
      ware: { _id: 1, name: 1 },
    }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/processes?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/processes?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <ProcessesClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
