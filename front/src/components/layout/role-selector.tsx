"use client"

import { useState } from "react"
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
import { cn } from "@/lib/utils"
import {
  ShieldCheck,
  Crown,
  Shield,
  Building2,
  Users,
  Store,
  BriefcaseBusiness,
  User,
  ChevronDown,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react"

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس فروشگاه",
}

const roleIconMap: Record<string, LucideIcon> = {
  Manager: Crown,
  Admin: Shield,
  Employee: BriefcaseBusiness,
  Ordinary: User,
  OrgHead: Building2,
  UnitHead: Users,
  StoreHead: Store,
}

function labelForRole(name?: string): string {
  return name ? (roleLabelMap[name] || name) : "نقش"
}

function scopeLabel(scopeType?: string): string {
  if (scopeType === "unit") return "واحد"
  if (scopeType === "organization") return "سازمان"
  if (scopeType === "store") return "فروشگاه"
  return scopeType || ""
}

function getScopeName(
  user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>,
  scopeType?: string,
  scopeId?: string
): string | null {
  if (!scopeType || !scopeId) return null
  if (scopeType === "organization") {
    const match = user.organizations?.find((o) => o._id === scopeId)
    if (match) return match.name
  }
  if (scopeType === "unit") {
    const match = user.units?.find((u) => u._id === scopeId)
    if (match) return match.name
  }
  if (scopeType === "store") {
    if (user.managedStore?._id === scopeId) return user.managedStore.name
    return null
  }
  return null
}

function setActiveRoleCookie(roleId: string) {
  document.cookie = `activeRoleId=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function RoleSelector() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  const ActiveIcon = (activeRole?.name && roleIconMap[activeRole.name]) || ShieldCheck
  const activeScope =
    activeRole?.scopeType && activeRole?.scopeId
      ? `${scopeLabel(activeRole.scopeType)} • ${getScopeName(user, activeRole.scopeType, activeRole.scopeId) || activeRole.scopeId}`
      : null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-10 gap-2.5 rounded-lg px-3 text-fog hover:text-glacier hover:bg-white/[0.04]"
          >
            <ShieldCheck className="size-5" />
            <span className="text-sm hidden sm:inline">
              {labelForRole(activeRole?.name)}
            </span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200 text-fog/50",
                open && "rotate-180",
              )}
            />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        dir="rtl"
        className="w-80 rounded-xl bg-graphite-plate/70 p-1.5 shadow-[0_0_30px_-8px_rgba(186,207,247,0.25)] ring-1 ring-frost-link/20"
      >
        <DropdownMenuGroup>
          <div className="mx-0.5 my-1 flex items-start gap-3 rounded-lg border-s-2 border-electric-iris bg-white/[0.04] p-3 ring-1 ring-inset ring-frost-link/15 shadow-[0_0_18px_-8px_rgba(102,58,243,0.6)]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-electric-iris/15 ring-1 ring-inset ring-electric-iris/25 shadow-[0_0_18px_-6px_rgba(102,58,243,0.5)]">
              <ActiveIcon className="size-5 text-electric-iris" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[10px] font-medium tracking-[0.14em] text-fog/70">
                نقش فعال
              </span>
              <span className="truncate text-sm font-semibold leading-normal text-glacier">
                {labelForRole(activeRole?.name)}
              </span>
              {activeScope && (
                <span className="truncate text-xs leading-normal text-fog">
                  {activeScope}
                </span>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-full bg-electric-iris/15 px-2 py-1 text-[11px] font-medium leading-none text-electric-iris">
              <span className="size-1.5 rounded-full bg-electric-iris motion-safe:animate-pulse" />
              فعال
            </span>
          </div>
        </DropdownMenuGroup>

        {otherRoles.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-steel-border/25" />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 pb-1 pt-2 text-[11px] font-medium tracking-[0.08em] text-fog">
                تغییر نقش
              </DropdownMenuLabel>
              {otherRoles.map((role, index) => {
                const RoleIcon = (role.name && roleIconMap[role.name]) || ShieldCheck
                const scope =
                  role.scopeType && role.scopeId
                    ? `${scopeLabel(role.scopeType)} • ${getScopeName(user, role.scopeType, role.scopeId) || role.scopeId}`
                    : null
                return (
                  <DropdownMenuItem
                    key={role.roleId || `role-${index}`}
                    dir="rtl"
                    onClick={() => handleRoleSwitch(role.roleId)}
                    className="group/role gap-3 rounded-lg px-2 py-2 focus:bg-white/[0.04] focus:text-moonlight"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-inset ring-steel-border/15 transition-colors duration-150 group-hover/role:bg-electric-iris/10 group-hover/role:ring-electric-iris/25">
                      <RoleIcon className="size-[18px] text-fog transition-colors duration-150 group-hover/role:text-electric-iris" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium leading-normal text-moonlight transition-colors duration-150 group-hover/role:text-glacier">
                        {labelForRole(role.name)}
                      </span>
                      {scope && (
                        <span className="truncate text-xs leading-normal text-fog">
                          {scope}
                        </span>
                      )}
                    </div>
                    <ChevronLeft className="size-4 -translate-x-1 text-fog/40 opacity-0 transition-all duration-150 group-hover/role:translate-x-0 group-hover/role:opacity-100" />
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator className="bg-steel-border/25" />
        <div className="flex items-center gap-2 px-2 py-2">
          <Shield className="size-4 shrink-0 text-fog/40" />
          <span className="text-[11px] leading-normal text-fog/60">
            انتخاب نقش، دسترسی شما را تغییر میدهد
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { RoleSelector }
