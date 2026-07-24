import { getMe } from "@/app/actions/auth/getMe"
import { Card } from "@/components/ui/card"
import { ProfileAvatar } from "./profile-avatar"

export default async function OrdinaryPage() {
  const result = await getMe({
    _id: 1,
    first_name: 1,
    last_name: 1,
    mobile: 1,
    email: 1,
    is_verified: 1,
    isActive: 1,
    position: 1,
    roles: 1,
    organizations: { _id: 1, name: 1 },
    units: { _id: 1, name: 1 },
    avatar: { _id: 1, name: 1 },
  })

  if (!result.success || !result.body) {
    return (
      <Card variant="glass" className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-fog">خطا در دریافت اطلاعات کاربری</p>
      </Card>
    )
  }

  const user = result.body

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card variant="glass" className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ProfileAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            avatar={user.avatar}
          />
          <div className="flex-1 space-y-4 text-center sm:text-right">
            <div>
              <h1 className="text-2xl font-semibold text-glacier">
                {user.first_name} {user.last_name}
              </h1>
              {user.position && (
                <p className="mt-1 text-sm text-fog">{user.position}</p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
              {(user.roles as Array<{ name: string; roleId: string }>)?.map((role) => (
                <span
                  key={role.roleId}
                  className="rounded-full bg-electric-iris/10 px-3 py-1 text-xs font-medium text-electric-iris ring-1 ring-electric-iris/20"
                >
                  {role.name === "Ordinary" ? "کاربر عادی" : role.name}
                </span>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-steel-border/40">
              <InfoRow label="ایمیل" value={user.email} />
              <InfoRow label="شماره موبایل" value={user.mobile} />
              {user.organizations?.length > 0 && (
                <InfoRow
                  label="سازمان"
                  value={(user.organizations as Array<{ name: string }>).map((o) => o.name).join("، ")}
                />
              )}
              {user.units?.length > 0 && (
                <InfoRow
                  label="واحد"
                  value={(user.units as Array<{ name: string }>).map((u) => u.name).join("، ")}
                />
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card variant="glass" className="p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-glacier">دسترسی‌ها</h2>
        {(user.roles as Array<{ name: string; roleId: string }>)?.map((role) => {
          const roleLabels: Record<string, string> = {
            Ordinary: "کاربر عادی",
            Employee: "کارمند",
            UnitHead: "رئیس واحد",
            StoreHead: "رئیس انبار",
            FinanceHead: "رئیس مالی",
            OrgHead: "رئیس سازمان",
            Admin: "مدیر سیستم",
            Manager: "مدیر ارشد",
            Ghost: "مدیر ارشد",
          }
          return (
            <div
              key={role.roleId}
              className="flex items-center justify-between rounded-lg border border-steel-border/40 px-4 py-3"
            >
              <span className="text-sm text-glacier">
                {roleLabels[role.name] || role.name}
              </span>
              <span className="text-xs text-emerald-400">فعال</span>
            </div>
          )
        })}
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-fog">{label}</span>
      <span className="text-sm text-glacier" dir="ltr">
        {value}
      </span>
    </div>
  )
}
