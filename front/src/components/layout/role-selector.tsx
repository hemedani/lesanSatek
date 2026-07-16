"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { setActiveRole } from "@/app/actions/auth/setActiveRole"
import { ShieldCheck } from "lucide-react"

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
}

function labelForRole(name?: string): string {
  return name ? (roleLabelMap[name] || name) : "نقش"
}

function setActiveRoleCookie(roleId: string) {
  document.cookie = `activeRoleId=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function RoleSelector() {
  const router = useRouter()
  const { user, activeRoleId, setActiveRoleId } = useAuthStore()

  if (!user || !user.roles || user.roles.length <= 1) return null

  const activeRole = user.roles.find((r) => r.roleId === activeRoleId)
  const otherRoles = user.roles.filter((r) => r.roleId !== activeRoleId)

  const handleRoleSwitch = async (roleId: string) => {
    const role = user.roles.find((r) => r.roleId === roleId)
    if (!role) return

    setActiveRoleCookie(roleId)
    setActiveRoleId(roleId)
    const { getPanelForRole } = await import("@/lib/roles")
    const targetPanel = getPanelForRole(role.name) || "/admin"
    await setActiveRole(roleId, role.name)
    router.push(targetPanel)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-fog hover:text-glacier hover:bg-white/[0.04]"
          >
            <ShieldCheck className="size-4" />
            <span className="text-sm hidden sm:inline">
              {labelForRole(activeRole?.name)}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        dir="rtl"
        className="w-72 shadow-subtle-4 ring-1 ring-frost-link/20"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="text-xs text-fog">نقش فعال</span>
          </DropdownMenuLabel>
          <DropdownMenuItem
            dir="rtl"
            className="gap-3 bg-electric-iris/10 text-frost-link"
            disabled
          >
            <ShieldCheck className="size-4 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{labelForRole(activeRole?.name)}</span>
              {activeRole?.scopeType && activeRole?.scopeId && (
                <span className="text-xs text-fog">
                  {activeRole.scopeType === "unit" ? "واحد" : activeRole.scopeType === "organization" ? "سازمان" : activeRole.scopeType} • {activeRole.scopeId}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {otherRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="text-xs text-fog">تغییر نقش</span>
              </DropdownMenuLabel>
              {otherRoles.map((role, index) => (
                <DropdownMenuItem
                  key={role.roleId || `role-${index}`}
                  dir="rtl"
                  onClick={() => handleRoleSwitch(role.roleId)}
                  className="gap-3"
                >
                  <ShieldCheck className="size-4 shrink-0 text-fog" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{labelForRole(role.name)}</span>
                    {role.scopeType && role.scopeId && (
                      <span className="text-xs text-fog">
                        {role.scopeType === "unit" ? "واحد" : role.scopeType === "organization" ? "سازمان" : role.scopeType}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { RoleSelector }
