import { getUsers } from "@/app/actions/user/getUsers";
import { UsersClient } from "./users-client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 20;

  const result = await getUsers(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    {
      _id: 1,
      first_name: 1,
      last_name: 1,
      email: 1,
      mobile: 1,
      isActive: 1,
      position: 1,
      roles: 1,
      organization: { _id: 1, name: 1 },
    }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/users?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/users?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : "";

  return (
    <UsersClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
    />
  );
}
