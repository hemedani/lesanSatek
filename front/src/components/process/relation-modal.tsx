"use client"

import { useState } from "react"
import { Loader2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchSelect } from "@/components/form/form-search-select"
import { ProcessScopeFieldsStandalone, type ProcessScopeValues } from "@/components/process/process-scope-fields"
import { gets as getOrgs } from "@/app/actions/organization/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface RelationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  scope: ProcessScopeValues
  onSave: (orgId: string, scope: ProcessScopeValues) => Promise<boolean>
}

export function RelationModal({ open, onOpenChange, orgId, scope, onSave }: RelationModalProps) {
  const [draftOrgId, setDraftOrgId] = useState(orgId)
  const [draftScope, setDraftScope] = useState<ProcessScopeValues>(scope)
  const [saving, setSaving] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftOrgId(orgId)
      setDraftScope(scope)
    }
    onOpenChange(nextOpen)
  }

  const handleScopeChange = (key: keyof ProcessScopeValues, value: string) => {
    setDraftScope((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    const ok = await onSave(draftOrgId, draftScope)
    setSaving(false)
    if (ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
              <Share2 className="size-5 text-electric-iris" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-moonlight">ویرایش ارتباط‌ها</DialogTitle>
              <DialogDescription className="mt-1.5">
                سازمان و حوزه کاربرد فرآیند را مشخص کنید
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-fog/70">سازمان</label>
              <SearchSelect
                value={draftOrgId}
                onChange={setDraftOrgId}
                placeholder="انتخاب سازمان…"
                fetcher={async (search?: string) => {
                  const result = await getOrgs(
                    {
                      activeRoleId: getActiveRoleIdFromStore(),
                      page: 1,
                      limit: 50,
                      search: search || undefined,
                    },
                    { _id: 1, name: 1 }
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((o: { _id?: string; name?: string }) => ({
                    _id: o._id || "",
                    name: o.name || "",
                  }))
                }}
                label="سازمان"
                disabled={saving}
              />
            </div>
            <div className="border-t border-steel-border/15 pt-5">
              <ProcessScopeFieldsStandalone
                values={draftScope}
                onChange={handleScopeChange}
                disabled={saving}
              />
            </div>
          </section>
        </div>

        <DialogFooter className="gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="gap-2 px-4"
            >
              انصراف
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={saving} className="gap-2 px-5">
              {saving && <Loader2 className="size-5 animate-spin" />}
              ذخیره ارتباط‌ها
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
