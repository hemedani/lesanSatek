"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormCard } from "@/components/form/form-card"
import { PageHeader } from "@/components/ui/page-header"
import { Form } from "@/components/ui/form"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { SearchSelect } from "@/components/form/form-search-select"
import { ErrorState } from "@/components/ui/error-state"
import { get as getOrg } from "@/app/actions/organization/get"
import { update } from "@/app/actions/organization/update"
import { updateRelations } from "@/app/actions/organization/updateRelations"
import { gets as getStates } from "@/app/actions/state/gets"
import { gets as getCities } from "@/app/actions/city/gets"
import { useAuthStore } from "@/stores/authStore"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import type { ReqType } from "@/types/declarations/selectInp"

const orgSchema = z.object({
  name: z.string().min(1, "نام سازمان الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type OrgData = z.infer<typeof orgSchema>

export default function OrgHeadSettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const orgId = user?.organizations?.[0]?._id

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState("")
  const [city, setCity] = useState("")

  const form = useForm<OrgData>({
    resolver: zodV4Resolver(orgSchema),
    defaultValues: { name: "", enName: "", description: "", isActive: true },
  })

  useEffect(() => {
    if (!orgId) return
    const load = async () => {
      const result = await getOrg(
        { activeRoleId: getActiveRoleIdFromStore(), _id: orgId },
        { _id: 1, name: 1, enName: 1, description: 1, isActive: 1, state: { _id: 1, name: 1 }, city: { _id: 1, name: 1 } },
      )
      if (result.success && result.body?.[0]) {
        const org = result.body[0]
        setState(org.state?._id || "")
        setCity(org.city?._id || "")
        form.reset({
          name: org.name || "",
          enName: org.enName || "",
          description: org.description || "",
          isActive: org.isActive ?? true,
        })
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [form, orgId])

  const onSubmit = async (data: OrgData) => {
    if (!orgId) return
    setSubmitting(true)

    const updateResult = await update(
      { activeRoleId: getActiveRoleIdFromStore(), _id: orgId, name: data.name, enName: data.enName || undefined, description: data.description || undefined, isActive: data.isActive },
      { _id: 1, name: 1 },
    )

    if (!updateResult.success) {
      toast.error(updateResult.body?.message || "خطا در به‌روزرسانی سازمان")
      setSubmitting(false)
      return
    }

    const relationsResult = await updateRelations(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: orgId,
        ...(state ? { state } : {}),
        ...(city ? { city } : {}),
      },
      { _id: 1, name: 1 },
    )

    setSubmitting(false)
    if (relationsResult.success) {
      toast.success("تنظیمات با موفقیت ذخیره شد")
      router.refresh()
    } else {
      toast.error(relationsResult.body?.message || "خطا در ذخیره روابط")
    }
  }

  if (!orgId) {
    return <ErrorState title="سازمان یافت نشد" message="اطلاعات سازمان در حساب کاربری شما یافت نشد." />
  }

  if (loading) return <LoadingSkeleton type="card" count={1} />

  if (notFound) {
    return <ErrorState title="سازمان مورد نظر یافت نشد" message="سازمانی با این شناسه در سامانه وجود ندارد." />
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="تنظیمات سازمان" description="ویرایش اطلاعات و تنظیمات سازمان" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormCard title="اطلاعات سازمان">
            <FormInput control={form.control} name="name" label="نام سازمان" required />
            <FormInput control={form.control} name="enName" label="نام انگلیسی" />
            <FormTextarea control={form.control} name="description" label="توضیحات" rows={3} />
            <FormCheckbox control={form.control} name="isActive" label="فعال" />
          </FormCard>

          <FormCard title="موقعیت مکانی" description="استان و شهر مرتبط با سازمان">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs text-fog/70 block font-medium">استان</label>
                <SearchSelect
                  value={state}
                  onChange={(v) => { setState(v); setCity("") }}
                  placeholder="انتخاب استان..."
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
                  label="استان"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-fog/70 block font-medium">شهر</label>
                <SearchSelect
                  value={city}
                  onChange={setCity}
                  placeholder="انتخاب شهر..."
                  fetcher={async (search?: string) => {
                    const result = await getCities(
                      {
                        activeRoleId: getActiveRoleIdFromStore(),
                        page: 1,
                        limit: 50,
                        search: search || undefined,
                        ...(state ? { stateId: state } : {}),
                      } as unknown as ReqType["main"]["city"]["gets"]["set"],
                      { _id: 1, name: 1 },
                    )
                    if (!result.success || !result.body) return []
                    return result.body.map((c: { _id?: string; name?: string }) => ({
                      _id: c._id || "",
                      name: c.name || "",
                    }))
                  }}
                  label="شهر"
                  disabled={submitting}
                />
              </div>
            </div>
          </FormCard>

          <div className="flex items-center gap-2 justify-end">
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
