import { gets } from "@/app/actions/inventory/gets";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, quantity: 1, minQuantity: 1, maxQuantity: 1, batchNo: 1, expirationDate: 1, location: 1, createdAt: 1, unit: { _id: 1, name: 1 }, warehouseUnit: { _id: 1, name: 1 }, wareModel: { _id: 1, name: 1 }, ware: { _id: 1, name: 1 } }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/inventory?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/inventory?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <InventoryClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
