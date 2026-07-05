"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth/logout"
import { useAuthStore } from "@/stores/authStore"
import { LogOut, User } from "lucide-react"

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
      <DropdownMenuContent align="end" dir="rtl" className="w-48 shadow-subtle-4 ring-1 ring-frost-link/20">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-xs text-fog">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem dir="rtl" onSelect={() => router.push("/admin")} className="focus:bg-electric-iris/5 focus:text-foreground">
          <User className="size-4" />
          پنل مدیریت
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem dir="rtl" onSelect={handleLogout} variant="destructive" className="focus:bg-ember/10">
          <LogOut className="size-4" />
          خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
