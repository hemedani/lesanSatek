import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getUser } from "@/app/actions/user/getUser"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { UserRelationsClient, type UserRelationsData } from "./user-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function UserRelationsPage({ params }: Props) {
  const { id } = await params

  const result = await getUser(
    { _id: id },
    {
      _id: 1,
      first_name: 1,
      last_name: 1,
      organizations: { _id: 1, name: 1 },
      units: { _id: 1, name: 1 },
      state: { _id: 1, name: 1 },
      city: { _id: 1, name: 1 },
    },
  )

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

  const data: UserRelationsData = {
    _id: user._id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    organizations: (user.organizations || []) as UserRelationsData["organizations"],
    units: (user.units || []) as UserRelationsData["units"],
    state: user.state || undefined,
    city: user.city || undefined,
  }

  return <UserRelationsClient user={data} />
}
