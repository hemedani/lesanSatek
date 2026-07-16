"use client"

import { useState, useCallback } from "react"
import { createRoot } from "react-dom/client"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  loading?: boolean
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  variant = "destructive",
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-ember/10 shrink-0">
              <AlertTriangle className="size-5 text-ember" />
            </div>
            <DialogTitle className="text-heading-sm font-medium text-moonlight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-fog body-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="gap-1.5"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }

interface ConfirmDialogOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    function DialogWrapper() {
      const [open, setOpen] = useState(true)
      const [loading, setLoading] = useState(false)

      const handleConfirm = useCallback(() => {
        setLoading(true)
        resolve(true)
        setOpen(false)
      }, [])

      const handleCancel = useCallback(() => {
        setOpen(false)
        resolve(false)
      }, [])

      return (
        <ConfirmDialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val)
            if (!val) resolve(false)
          }}
          title={options.title}
          description={options.description}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          variant={options.variant}
          onConfirm={handleConfirm}
          loading={loading}
        />
      )
    }

    root.render(<DialogWrapper />)

    setTimeout(() => {
      const timer = setInterval(() => {
        if (!document.body.contains(container)) {
          clearInterval(timer)
          return
        }
        const dialog = container.querySelector("[role='dialog']")
        if (!dialog) {
          root.unmount()
          container.remove()
          resolve(false)
          clearInterval(timer)
        }
      }, 200)
    }, 0)
  })
}
