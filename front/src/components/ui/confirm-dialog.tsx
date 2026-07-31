"use client"

import { useState, useCallback, useEffect } from "react"
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
  dialogId?: string
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
  dialogId,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl" data-confirm-dialog={dialogId}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 ring-1 ring-inset ring-ember/20">
              <AlertTriangle className="size-5 text-ember" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-moonlight">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="gap-1.5"
          >
            {loading && <Loader2 className="size-5 animate-spin" />}
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
    const dialogId = `cd-${Date.now()}`

    function DialogWrapper() {
      const [open, setOpen] = useState(true)
      const [loading, setLoading] = useState(false)

      const handleConfirm = useCallback(() => {
        setLoading(true)
        resolve(true)
        setOpen(false)
      }, [])

      useEffect(() => {
        if (!open) {
          const t = setTimeout(() => {
            root.unmount()
            container.remove()
          }, 300)
          return () => clearTimeout(t)
        }
      }, [open])

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
          dialogId={dialogId}
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
        const dialog = document.querySelector(`[data-confirm-dialog="${dialogId}"]`)
        if (!dialog) {
          root.unmount()
          container.remove()
          resolve(false)
          clearInterval(timer)
        }
      }, 500)
    }, 500)
  })
}
