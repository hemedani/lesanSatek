import { gets } from "@/app/actions/stuff/gets";
import { StuffClient } from "./stuff-client";

export default async function StuffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, inventoryNo: 1, price: 1, hasAbsolutePrice: 1, pricePercentage: 1, createdAt: 1, ware: { _id: 1, name: 1 }, store: { _id: 1, name: 1 } }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/stuff?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/stuff?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <StuffClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
