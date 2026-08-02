import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/process/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { ProcessEditClient } from "./process-edit-client"
import type { Process } from "./process-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROCESS_PROJECTION = {
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
  steps: { _id: 1, name: 1, description: 1, stepType: 1, order: 1, required: 1, groupsOperator: 1 },
} as const

export default async function EditProcessPage({ params }: Props) {
  const { id } = await params

  const result = await get({ _id: id }, PROCESS_PROJECTION)
  const process = result.success && result.body?.[0] ? (result.body[0] as Process) : null

  if (!process) {
    return (
      <div>
        <ErrorState
          title="فرآیند مورد نظر یافت نشد"
          message="فرآیندی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/processes">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به فرآیندها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ProcessEditClient process={process} />
}
