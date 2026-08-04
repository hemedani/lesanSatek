"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { logout } from "@/app/actions/auth/logout"
import { useAuthStore } from "@/stores/authStore"
import { LogOut, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس فروشگاه",
}

function labelForRole(name?: string): string | undefined {
  return name ? (roleLabelMap[name] || name) : undefined
}

function UserMenu() {
  const router = useRouter()
  const { user, activeRoleId, logout: clearStore } = useAuthStore()

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((n) => n?.[0])
    .join("")

  const activeRole = user?.roles?.find((r) => r.roleId === activeRoleId)
  const roleLabel = labelForRole(activeRole?.name)

  const handleLogout = async () => {
    clearStore()
    await logout()
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label="منوی حساب کاربری"
            className="h-10 w-10 rounded-full"
          />
        }
      >
        <Avatar size="default" className="size-9 ring-2 ring-electric-iris/20">
          {user?.avatar?.url ? (
            <AvatarImage src={user.avatar.url} alt={initials || "کاربر"} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-electric-iris/30 to-frost-link/15 text-xs font-semibold text-glacier">
              {initials || "👤"}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" dir="rtl" className="min-w-72 shadow-subtle-4 ring-1 ring-frost-link/20">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="ps-3 pe-3 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                {user?.avatar?.url ? (
                  <AvatarImage src={user.avatar.url} alt={initials || "کاربر"} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-electric-iris/30 to-frost-link/15 text-sm font-semibold text-glacier">
                    {initials || "👤"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-moonlight">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="truncate text-xs text-fog">{user?.email}</span>
                {roleLabel && (
                  <Badge variant="outline" className="mt-1.5 w-fit gap-1 border-electric-iris/25 bg-electric-iris/10 px-2 py-0 text-[11px] text-frost-link normal-case">
                    <ShieldCheck className="size-3" />
                    {roleLabel}
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem dir="rtl" onClick={handleLogout} variant="destructive" className="focus:bg-ember/10">
          <LogOut className="size-4" />
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }