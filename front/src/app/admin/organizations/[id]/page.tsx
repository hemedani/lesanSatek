import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/organization/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { OrgEditClient } from "./org-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditOrganizationPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    { _id: 1, name: 1, enName: 1, description: 1, isActive: 1, location: 1 }
  )

  const org = result.success && result.body?.[0] ? result.body[0] : null

  if (!org) {
    return (
      <div>
        <ErrorState
          title="سازمان مورد نظر یافت نشد"
          message="سازمانی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/organizations">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به سازمان‌ها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <OrgEditClient org={org} />
}
