"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Building2, MapPin, ClipboardList, MapPinned, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { LocationPicker } from "@/components/ui/location-picker"
import type { GeoPoint } from "@/components/ui/location-picker"
import { add as addOrganization } from "@/app/actions/organization/add"
import { gets as getStates } from "@/app/actions/state/gets"
import { gets as getCities } from "@/app/actions/city/gets"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const orgSchema = z.object({
  name: z.string().min(1, "نام سازمان الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean(),
})

type OrgData = z.infer<typeof orgSchema>

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Card variant="glass" className="[--card-spacing:--spacing(6)]">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export default function AddOrganizationPage() {
  const router = useRouter()
  const [geoLocation, setGeoLocation] = useState<GeoPoint>(null)

  const form = useForm<OrgData>({
    resolver: zodV4Resolver(orgSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      state: "",
      city: "",
      isActive: true,
    },
  })

  const selectedState = form.watch("state")

  const onSubmit = async (data: OrgData) => {
    try {
      const result = await addOrganization(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          name: data.name,
          enName: data.enName || undefined,
          description: data.description || undefined,
          state: data.state || undefined,
          city: data.city || undefined,
          isActive: data.isActive,
          ...(geoLocation ? { location: geoLocation } : {}),
        },
        { _id: 1, name: 1 },
      )
      if (result.success) {
        toast.success("سازمان با موفقیت ایجاد شد")
        router.push("/admin/organizations")
      } else {
        toast.error(result.body?.message || "خطا در ایجاد سازمان")
      }
    } catch {
      toast.error("خطا در ایجاد سازمان")
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="افزودن سازمان"
        description="اطلاعات اولیه سازمان را وارد کنید؛ پس از ایجاد، می‌توانید واحدها و کاربران را تعریف کنید."
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-org-add" tooltip="راهنمای ایجاد سازمان" />
          <Link href="/admin/organizations">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به سازمان‌ها
            </Button>
          </Link>
        </div>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={Building2}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات اصلی"
          >
            <FormInput
              control={form.control}
              name="name"
              label="نام سازمان"
              placeholder="مثال: شرکت نمونه"
              required
              disabled={submitting}
            />
            <FormInput
              control={form.control}
              name="enName"
              label="نام انگلیسی"
              placeholder="Example: Sample Inc."
              disabled={submitting}
            />
          </SectionCard>

          <SectionCard
            icon={MapPin}
            iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
            title="موقعیت"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSearchSelect
                control={form.control}
                name="state"
                label="استان"
                placeholder="انتخاب استان…"
                disabled={submitting}
                fetcher={async (search?: string) => {
                  const result = await getStates(
                    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                    { _id: 1, name: 1 },
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((s: { _id?: string; name?: string }) => ({
                    _id: s._id || "",
                    name: s.name || "",
                  }))
                }}
              />
              <FormSearchSelect
                control={form.control}
                name="city"
                label="شهر"
                placeholder="انتخاب شهر…"
                disabled={submitting}
                fetcher={async (search?: string) => {
                  const result = await getCities(
                    {
                      activeRoleId: getActiveRoleIdFromStore(),
                      page: 1,
                      limit: 50,
                      search: search || undefined,
                      ...(selectedState ? { stateId: selectedState } : {}),
                    } as unknown as ReqType["main"]["city"]["gets"]["set"],
                    { _id: 1, name: 1 },
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((c: { _id?: string; name?: string }) => ({
                    _id: c._id || "",
                    name: c.name || "",
                  }))
                }}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={ClipboardList}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="توضیحات و وضعیت"
          >
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره سازمان…"
              rows={3}
              disabled={submitting}
            />
            <FormCheckbox control={form.control} name="isActive" label="فعال" disabled={submitting} />
          </SectionCard>

          <SectionCard
            icon={MapPinned}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title="موقعیت جغرافیایی"
          >
            <LocationPicker value={geoLocation} onChange={setGeoLocation} />
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Check className="size-5" />
                  )}
                  ثبت سازمان
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={submitting}
                  onClick={() => router.push("/admin/organizations")}
                  className="gap-2 px-5"
                >
                  <X className="size-5" />
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
