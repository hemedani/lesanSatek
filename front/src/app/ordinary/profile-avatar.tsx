"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ProfileAvatarProps {
  firstName?: string
  lastName?: string
  avatar?: { _id: string; name?: string } | null
}

function ProfileAvatar({ firstName, lastName, avatar }: ProfileAvatarProps) {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n?.[0])
    .join("")

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:1370"
  const avatarUrl = avatar?._id
    ? `${backendUrl}/files/${avatar._id}/${avatar.name || "avatar"}`
    : undefined

  return (
    <Avatar size="lg" className="shrink-0 ring-2 ring-frost-link/20">
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
      ) : null}
      <AvatarFallback className="bg-graphite-plate text-2xl font-semibold text-moonlight">
        {initials || "👤"}
      </AvatarFallback>
    </Avatar>
  )
}

export { ProfileAvatar }
