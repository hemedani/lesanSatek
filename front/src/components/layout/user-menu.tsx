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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth/logout"
import { useAuthStore } from "@/stores/authStore"
import { LogOut } from "lucide-react"

function UserMenu() {
  const router = useRouter()
  const { user, logout: clearStore } = useAuthStore()

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((n) => n?.[0])
    .join("")

  const handleLogout = async () => {
    await logout()
    clearStore()
    router.push("/login")
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
