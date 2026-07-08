import { gets } from "@/app/actions/purchasingRequest/gets";
import { PurchasingRequestsClient } from "./purchasing-requests-client";

export default async function PurchasingRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await gets(
    {
      activeRoleId: "",
      page,
      limit,
      search: resolvedSearchParams.search || undefined,
    },
    {
      _id: 1,
      title: 1,
      status: 1,
      estimatedAmount: 1,
      quantity: 1,
      currentStep: 1,
      createdAt: 1,
      process: { _id: 1, name: 1 },
    }
  );

  const items = result.success ? result.body : [];

  const params = new URLSearchParams();
  if (resolvedSearchParams.search) params.set("search", resolvedSearchParams.search);
  if (resolvedSearchParams.status) params.set("status", resolvedSearchParams.status);

  const prevPageUrl = page > 1 ? `/admin/purchasing-requests?page=${page - 1}&${params.toString()}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/purchasing-requests?page=${page + 1}&${params.toString()}` : "";

  return (
    <PurchasingRequestsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
      statusFilter={resolvedSearchParams.status || ""}
    />
  );
}
