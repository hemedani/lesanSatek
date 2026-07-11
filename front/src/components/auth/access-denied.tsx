import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-ember/10">
        <ShieldAlert className="size-8 text-ember" />
      </div>
      <h1 className="text-xl font-semibold text-glacier">
        دسترسی محدود
      </h1>
      <p className="max-w-md text-sm text-fog">
        {message || "شما دسترسی لازم برای این بخش را ندارید."}
      </p>
      <Link href="/admin">
        <Button variant="outline" className="mt-2">
          بازگشت به داشبورد
        </Button>
      </Link>
    </div>
  )
}

export { AccessDenied }
