import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getUser } from "@/app/actions/user/getUser"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { UserRolesClient, type UserRolesData, type ScopeNameMap } from "./user-roles-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function UserRolesPage({ params }: Props) {
  const { id } = await params

  const [result, orgsResult, unitsResult] = await Promise.all([
    getUser(
      { _id: id },
      {
        _id: 1,
        first_name: 1,
        last_name: 1,
        roles: 1,
      },
    ),
    getOrganizations({ activeRoleId: "", page: 1, limit: 100 }, { _id: 1, name: 1 }),
    getUnits({ activeRoleId: "", page: 1, limit: 100 }, { _id: 1, name: 1 }),
  ])

  const user = result.success && result.body ? result.body : null

  if (!user) {
    return (
      <div>
        <ErrorState
          title="کاربر مورد نظر یافت نشد"
          message="کاربری با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/users">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به کاربران
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const scopeNameMap: ScopeNameMap = {}
  if (orgsResult.success) {
    for (const o of orgsResult.body || []) {
      if (o._id && o.name) scopeNameMap[o._id] = o.name
    }
  }
  if (unitsResult.success) {
    for (const u of unitsResult.body || []) {
      if (u._id && u.name) scopeNameMap[u._id] = u.name
    }
  }

  const data: UserRolesData = {
    _id: user._id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    roles: (user.roles || []) as UserRolesData["roles"],
  }

  return <UserRolesClient user={data} scopeNameMap={scopeNameMap} />
}
