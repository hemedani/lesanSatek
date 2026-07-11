"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth/logout"
import { setActiveRole } from "@/app/actions/auth/setActiveRole"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"
import { LogOut, User, Shield } from "lucide-react"

function UserMenu() {
  const router = useRouter()
  const { user, activeRoleId, setActiveRoleId, logout: clearStore } = useAuthStore()

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((n) => n?.[0])
    .join("")

  const handleLogout = async () => {
    await logout()
    clearStore()
    router.push("/login")
  }

  const handleRoleChange = async (roleId: string) => {
    document.cookie = `activeRoleId=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    setActiveRoleId(roleId)
    await setActiveRole(roleId)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
        <Avatar size="sm">
          <AvatarFallback className="text-xs bg-graphite-plate text-moonlight shadow-subtle-3">{initials || "👤"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" dir="rtl" className="min-w-72 shadow-subtle-4 ring-1 ring-frost-link/20">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-xs text-fog">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {user?.roles && user.roles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex items-center gap-2 text-xs text-fog">
                  <Shield className="size-3.5" />
                  نقش فعال
                </div>
              </DropdownMenuLabel>
              {activeRoleId && (
                <DropdownMenuRadioGroup value={activeRoleId} onValueChange={handleRoleChange}>
                  {user.roles.map((role, index) => (
                    <DropdownMenuRadioItem key={role.roleId || `role-${index}`} value={role.roleId} dir="rtl" className="pe-8">
                      {role.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              )}
            </DropdownMenuGroup>
          </>
        )}

        {useAuthStore.getState().accessiblePanels.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex items-center gap-2 text-xs text-fog">
                  <User className="size-3.5" />
                  پنل‌ها
                </div>
              </DropdownMenuLabel>
              {useAuthStore.getState().accessiblePanels.map((panel) => {
                const Icon = panel.icon
                const isActive = typeof window !== "undefined" && window.location.pathname.startsWith(panel.path)
                return (
                  <DropdownMenuItem
                    key={panel.id}
                    dir="rtl"
                    onClick={() => router.push(panel.path)}
                    className={cn(
                      "gap-3 focus:bg-electric-iris/5 focus:text-foreground",
                      isActive && "bg-electric-iris/10 text-frost-link",
                    )}
                  >
                    <Icon className="size-4" />
                    <div className="flex flex-col">
                      <span className="text-sm">{panel.label}</span>
                      <span className="text-xs text-fog">{panel.description}</span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem dir="rtl" onClick={handleLogout} variant="destructive" className="focus:bg-ember/10">
          <LogOut className="size-4" />
          خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
