import { gets } from "@/app/actions/goodsReceipt/gets";
import { GoodsReceiptsClient } from "./goods-receipts-client";

export default async function GoodsReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, receiptNumber: 1, status: 1, description: 1, receivedAt: 1, createdAt: 1 }
  );

  const items = result.success ? result.body : [];

  const params = new URLSearchParams();
  if (resolvedSearchParams.search) params.set("search", resolvedSearchParams.search);
  const prevPageUrl = page > 1 ? `/admin/goods-receipts?page=${page - 1}&${params.toString()}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/goods-receipts?page=${page + 1}&${params.toString()}` : "";

  return (
    <GoodsReceiptsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
