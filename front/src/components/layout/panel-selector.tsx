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
import { getAccessiblePanels } from "@/lib/roles"
import { setActiveRole } from "@/app/actions/auth/setActiveRole"
import { LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

function setActiveRoleCookie(roleId: string) {
  document.cookie = `activeRoleId=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function PanelSelector() {
  const router = useRouter()
  const { user, setActiveRoleId } = useAuthStore()

  if (!user) return null

  const accessiblePanels = getAccessiblePanels(user)
  if (accessiblePanels.length <= 1) return null

  const currentPanel = accessiblePanels.find((p) =>
    window.location.pathname.startsWith(p.path),
  )

  const handlePanelSwitch = async (panelPath: string) => {
    const targetPanel = accessiblePanels.find((p) => p.path === panelPath)
    if (!targetPanel) return

    const roleForPanel = user.roles?.find((r) =>
      targetPanel.requiredRole?.includes(r.name),
    )
    if (roleForPanel) {
      setActiveRoleCookie(roleForPanel.roleId)
      setActiveRoleId(roleForPanel.roleId)
      await setActiveRole(roleForPanel.roleId)
    }

    router.push(panelPath)
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
            <LayoutDashboard className="size-4" />
            <span className="text-sm hidden sm:inline">
              {currentPanel?.label ?? "پنل‌ها"}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        dir="rtl"
        className="min-w-56 shadow-subtle-4 ring-1 ring-frost-link/20"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="text-xs text-fog">پنل‌های قابل دسترسی</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {accessiblePanels.map((panel) => {
          const Icon = panel.icon
          const isActive = window.location.pathname.startsWith(panel.path)
          return (
            <DropdownMenuItem
              key={panel.id}
              dir="rtl"
              onClick={() => handlePanelSwitch(panel.path)}
              className={cn(
                "gap-3",
                isActive && "bg-electric-iris/10 text-frost-link",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{panel.label}</span>
                <span className="text-xs text-fog">{panel.description}</span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { PanelSelector }
