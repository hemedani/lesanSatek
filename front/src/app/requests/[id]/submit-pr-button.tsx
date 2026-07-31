"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubmitPRDialog } from "@/components/purchasing/submit-pr-dialog"

interface SubmitPRButtonProps {
  purchasingRequestId: string
  title?: string
  quantity?: number
  wareModelName?: string
  className?: string
}

export function SubmitPRButton({ purchasingRequestId, title, quantity, wareModelName, className }: SubmitPRButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button className={className || "w-full gap-2"} onClick={() => setOpen(true)}>
        <Send className="size-5" />
        ارسال درخواست
      </Button>
      <SubmitPRDialog
        open={open}
        onOpenChange={setOpen}
        purchasingRequestId={purchasingRequestId}
        title={title}
        quantity={quantity}
        wareModelName={wareModelName}
      />
    </>
  )
}
