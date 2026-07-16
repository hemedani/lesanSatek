"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/authStore"
import { Building2, Users } from "lucide-react"
import { get } from "@/app/actions/unit/get"

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
}

function PanelContext() {
  const { user, activeRoleId } = useAuthStore()
  const [unitName, setUnitName] = useState<string | undefined>()

  const orgName = user?.organization?.name
  const activeRole = user?.roles?.find((r) => r.roleId === activeRoleId)
  const roleLabel = activeRole?.name ? (roleLabelMap[activeRole.name] || activeRole.name) : null

  const scopeId = activeRole?.scopeType === "unit" && activeRole.scopeId ? activeRole.scopeId : undefined

  useEffect(() => {
    if (!scopeId) return
    let cancelled = false
    get({ _id: scopeId, activeRoleId: activeRoleId || "" }, { _id: 1, name: 1 }).then((res) => {
      if (cancelled) return
      if (res.success && res.body?.[0]?.name) {
        setUnitName(res.body[0].name)
      }
    })
    return () => { cancelled = true }
  }, [scopeId])

  const displayUnit = unitName || user?.headedUnit?.name || user?.units?.[0]?.name

  if (!orgName && !displayUnit && !roleLabel) return null

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] ring-1 ring-inset ring-steel-border/15">
      {orgName && (
        <div className="flex items-center gap-1.5 text-xs text-fog/60">
          <Building2 className="size-3 text-frost-link/50" />
          <span>{orgName}</span>
        </div>
      )}
      {orgName && (displayUnit || roleLabel) && <span className="text-fog/15 mx-0.5">/</span>}
      {displayUnit && (
        <div className="flex items-center gap-1.5 text-xs text-fog/60">
          <Users className="size-3 text-frost-link/50" />
          <span>{displayUnit}</span>
        </div>
      )}
      {displayUnit && roleLabel && <span className="text-fog/15 mx-0.5">/</span>}
      {roleLabel && (
        <span className="text-xs text-fog/50">{roleLabel}</span>
      )}
    </div>
  )
}

export { PanelContext }
